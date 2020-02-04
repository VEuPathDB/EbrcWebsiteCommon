import React, { useCallback, useState } from 'react';
import { groupBy, noop } from 'lodash';
import { safeHtml } from 'wdk-client/Utils/ComponentUtils';
import { Link, IconAlt } from 'wdk-client/Components';
import {useWdkEffect} from 'wdk-client/Service/WdkService';
import { useSessionBackedState } from 'wdk-client/Hooks/SessionBackedState';

const stopIcon = (
  <span className="fa-stack" style={{ fontSize: '1.2em' }}>
    <i className="fa fa-circle fa-stack-2x" style={{color: 'darkred'}}/>
    <i className="fa fa-times fa-stack-1x" style={{color: 'white'}}/>
  </span>
);

const warningIcon = (
  <span className="fa-stack" style={{ fontSize: '1.2em' }}>
    <i className="fa fa-exclamation-triangle fa-stack-2x" style={{color: '#ffeb3b'}}/>
    <i className="fa fa-exclamation fa-stack-1x" style={{color: 'black', fontSize: '1.3em', top: 2}}/>
  </span>
);

const infoIcon = (
  <span className="fa-stack" style={{ fontSize: '1.2em' }}>
    <i className="fa fa-circle fa-stack-2x" style={{color: '#004aff'}}/>
    <i className="fa fa-info fa-stack-1x" style={{color: 'white'}}/>
  </span>
);

// Array of announcements to show. Each element of the array is a function that takes props
// and returns a React Element. Use props as an opportunity to determine if the message should
// be displayed for the given context.
const siteAnnouncements = [
  // alpha
  {
    id: 'alpha',
    dismissible: false,
    renderDisplay: props => {
      if (param('alpha', location) === 'true' || /^(alpha|a1|a2)/.test(location.hostname)) {
        return (
          <div key="alpha">
            This pre-release version of {props.projectId} is available for early community review.
            Your searches and strategies saved in this alpha release will not be available in the
            official release.
            Please explore the site and <Link to="/contact-us">contact us</Link> with your feedback.
            This site is under active development so there may be incomplete or
            inaccurate data and occasional site outages can be expected.
          </div>
        );
      }
    }
  },

  // beta
  {
    id: 'beta',
    dismissible: false,
    renderDisplay: props => {
      if (param('beta', location) === 'true' || /^(beta|b1|b2)/.test(location.hostname)) {
        return (
          <div key="beta">
            This pre-release version of {props.projectId} is available for early community review.
            Please explore the site and <Link to="/contact-us">contact us</Link> with your feedback.
            Note that any saved strategies in the beta sites will be lost once the
            sites are fully released. Some of our sites remain under active development
            during their Beta release which might require occasional site outages or data re-analysis.
          </div>
        );
      }
    }
  },

  // Blast
/*
  (props) => {
    if (props.projectId != 'OrthoMCL' && (/showQuestion\.do.+blast/i).test(location.href)) {
      return (
        <div key="blast">
          As of 3 Feb 2014, this search uses NCBI-BLAST to determine sequence similarity.
          Prior versions of the search used WU-BLAST.
          <a target="_blank" href="http://www.ncbi.nlm.nih.gov/blast/Blast.cgi?CMD=Web&PAGE_TYPE=BlastDocs">NCBI-BLAST help.</a>
        </div>
      );
    }
    return null;
  },
*/
 // Clinepi home page
 {
   id: "clinepi-PERCH",
   dismissible: false,
   renderDisplay: (props) => {
    if ( (props.projectId == 'AllClinEpiDB' || props.projectId == 'ClinEpiDB') && location.pathname.endsWith('/app/record/dataset/DS_1595200bb8') ) {
      return (
        <div key="clinepi-PERCH">
          To request access to the PERCH data, please email Christine Prosperi at <a href = "mailto: cprospe1@jhu.edu">cprospe1@jhu.edu</a>.
        </div>
      );
    }
    return null;
  }
 },

// Fungi gene page for Cryptococcus neoformans KN99
/*  (props) => { 
    if ( (props.projectId == 'FungiDB') && 
         ( (location.pathname.indexOf("/app/record/gene/CKF44_") > -1)    ||
           (location.pathname.indexOf("/app/record/gene/cneoKN99_") > -1)
         )  
       ) 
    {
      return (
        <div key="geneFungi">
          <i>Cryptococcus neoformans</i> var. grubii KN99 GeneIDs and functional annotation were updated in FungiDB Release 41. To access new GeneIDs navigate to the <i>Names, Previous Identifiers, and Aliases</i> section located within the <i>Annotation, curation and identifiers</i> contents menu of the gene record pages. The genome will be reloaded in the Release 42 integrating the updated GeneIDs as default identifiers.
        </div>
      );
    }
    return null;
  },
*/

// TriTryp gene page for Bodo saltans strain Lake Konstanz
  {
    id: 'geneFungi',
    dismissible: false,
    renderDisplay: props => { 
      if ( (props.projectId == 'TriTrypDB') && 
           ( (location.pathname.indexOf("/app/record/gene/BS") > -1)    ||
             (location.pathname.indexOf("/app/record/gene/BSAL_") > -1)
           )  
         ) 
      {
        return (
          <div key="geneFungi">
            This <i>Bodo saltans</i> genome sequence and annotation represents a draft version. Please carefully consider gene models and genome structure before drawing conclusions.
          </div>
        );
      }
      return null;
    }
  },

  // OrthoMCL enzyme/compound
  {
    id: 'ortho-enzyme',
    dismissible: false,
    renderDisplay: (props) => {
      if (props.projectId == 'OrthoMCL' && (/(enzyme|compound)/i).test(location.href)) {
        return (
          <div key="ortho-enzyme">
            Note: the Enzyme Commission (EC) numbers associated with proteins were
            obtained only from UniProt. In future releases we expect to include EC
            numbers from multiple sources including the annotation.
          </div>
        );
      }
      return null;
    }
  }

  // Alt-splice release
/*
  (props) => {
    return props.projectId == 'OrthoMCL' ? null : (
      <div key="alt-splice-release">
Release 29 is an alpha release that includes significant updates to the underlying data and infrastructure. In addition to refreshing all data to the latest versions, we redesigned gene pages, incorporated alternative transcripts into gene pages and searches, and updated search categories.
Please <Link to="/contact-us"> Contact Us</Link> to let us know what you think. Release 28 is still available and fully functional.
      </div>
    );
  }
*/
];

/**
 * Info boxes containing announcements.
 */
export default function Announcements(props) {
  const [ data, setData ] = useState();
  useWdkEffect(wdkService => {
    let doUpdate = true;
    (async () => {
      const { projectId } = await wdkService.getConfig();
      const announcements = await wdkService.getSiteMessages();
      const location = window.location;
      if (doUpdate) setData({ projectId, announcements, location });
    })();
    return () => { doUpdate = false };
  }, []);

  const [ closedBanners, setClosedBanners ] = useSessionBackedState(
    [],
    'eupath-Announcements',
    closedBanners => closedBanners.join(','),
    closedBannersString => closedBannersString.split(/\s*,\s*/g)
  );

  const onCloseFactory = useCallback(id => () => {
    setClosedBanners([ ...closedBanners, id ]);
  }, [ closedBanners ]);

  if (data == null) return null;

  const { down = [], degraded = [], information = [] } = groupBy(data.announcements, 'category');

  return (
    <div>
      {
        [
          ...down,
          ...degraded,
          ...information,
          ...siteAnnouncements
        ].map(announcementData => {
          const dismissible = announcementData.dismissible == null ? true : false;

          return (
            <AnnouncementContainer
              key={announcementData.id}
              category={announcementData.category || 'info'}
              dismissible={dismissible}
              isOpen={dismissible ? !closedBanners.includes(`${announcementData.id}`) : true}
              onClose={dismissible === false ? onCloseFactory(`${announcementData.id}`) : noop}
              display={typeof announcementData.renderDisplay === 'function' 
                ? announcementData.renderDisplay({ projectId: data.projectId, location: data.location })
                : toElement(announcementData)
              }
            />
          );
        })}
    </div>
  );
}

/**
 * Container for a single announcement banner.
 */
function AnnouncementContainer(props) {
  const icon = props.category === 'down'
    ? stopIcon
    : props.category === 'degraded'
    ? warningIcon
    : infoIcon;

  return <AnnouncementBanner {...props} icon={icon} />;
}

/**
 * Banner for a single announcement.
 */
function AnnouncementBanner({ 
  isOpen, 
  onClose, 
  icon,
  display,
  dismissible
}) {
  if (display == null) {
    return null;
  }

  return (
    <div className="eupathdb-Announcement" style={{
      padding: '.5em',
      borderWidth: '0 1px 1px 1px',
      borderColor: '#bbbbbb',
      borderStyle: 'solid',
      background: '#E3F2FD',
      display: isOpen ? 'block' : 'none'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center'
      }}>
        {icon}
        <div style={{
          display: 'inline-block',
          width: 'calc(100% - 5.5em)',
          padding: '8px',
          verticalAlign: 'middle',
          color: 'darkred',
          fontSize: '1.1em'
        }}>
          {display}
        </div>
        {
          dismissible &&
          <button onClick={onClose} className="link" style={{
            color: '#7c7c7c',
            alignSelf: 'flex-start',
            fontSize: '0.8em'
          }}>
            <IconAlt fa="times" className="fa-2x" />
          </button>
        }
      </div>
    </div>
  );
}

/**
 * Convert html string to a React Element
 *
 * @param {string} html
 * @return {React.Element}
 */
function toElement({ message }) {
  return safeHtml(message, { key: message }, 'div');
}

/**
 * Join elements with <hr/>
 *
 * @param {React.Element[]|null} previous
 * @param {React.Element} next
 * @return {React.Element[]}
 */
function injectHr(previous, next) {
  return previous == null ? [ next ] : previous.concat(<hr/>, next);
}

/**
 * Returns a function that takes another function and calls it with `args`.
 * @param {any[]} ...args
 * @return {(fn: Function) => any}
 */
function invokeWith(...args) {
  return fn => fn(...args);
}

/**
 * Find the value of the first param in the location object.
 *
 * @param {string} name The param name
 * @param {Location} location
 * @return {string?}
 */
function param(name, location) {
  return location.search
    .slice(1)
    .split('&')
    .map(entry => entry.split('='))
    .filter(entry => entry[0] === name)
    .map(entry => entry[1])
    .map(decodeURIComponent)
    .find(() => true);
}
