import PropTypes from 'prop-types';
import { identity } from 'lodash';
import { safeHtml } from 'wdk-client/ComponentUtils';

const AnnouncementPropTypes = {
  projectId: PropTypes.string.isRequired,
  webAppUrl: PropTypes.string.isRequired,
  location: PropTypes.object.isRequired,
  announcements: PropTypes.shape({
    information: PropTypes.arrayOf(PropTypes.string),
    degraded: PropTypes.arrayOf(PropTypes.string),
    down: PropTypes.arrayOf(PropTypes.string)
  })
};

const stopIcon = (
  <span className="fa-stack" style={{ fontSize: '1.6em' }}>
    <i className="fa fa-circle fa-stack-2x" style={{color: 'darkred'}}/>
    <i className="fa fa-times fa-stack-1x" style={{color: 'white'}}/>
  </span>
);

const warningIcon = (
  <span className="fa-stack" style={{ fontSize: '1.6em' }}>
    <i className="fa fa-exclamation-triangle fa-stack-2x" style={{color: '#ffeb3b'}}/>
    <i className="fa fa-exclamation fa-stack-1x" style={{color: 'black', fontSize: '1.3em', top: 2}}/>
  </span>
);

const infoIcon = (
  <span className="fa-stack" style={{ fontSize: '1.6em' }}>
    <i className="fa fa-circle fa-stack-2x" style={{color: '#004aff'}}/>
    <i className="fa fa-info fa-stack-1x" style={{color: 'white'}}/>
  </span>
);

// Array of announcements to show. Each element of the array is a function that takes props
// and returns a React Element. Use props as an opportunity to determine if the message should
// be displayed for the given context.
const siteAnnouncements = [
  // alpha
  (props) => {
    if (param('alpha', location) === 'true' || /^(alpha|a1|a2)/.test(location.hostname)) {
      return (
        <div key="alpha">
          This pre-release version of {props.projectId} is available for early community review.
          Your searches and strategies saved in this alpha release will not be available in the
          official release.
          Please explore the site and <a className="new-window" data-name="contact_us"
            href={props.webAppUrl + '/contact.do'}>contact us</a> with your feedback.
          This site is under active development so there may be incomplete or
          inaccurate data and occasional site outages can be expected.
        </div>
      );
    }
  },

  // beta
  (props) => {
    if (param('beta', location) === 'true' || /^(beta|b1|b2)/.test(location.hostname)) {
      return (
        <div key="beta">
          This pre-release version of {props.projectId} is available for early community review.
          Please explore the site and <a className="new-window" data-name="contact_us"
            href={props.webAppUrl + '/contact.do'}>contact us</a> with your feedback.
          Note that any saved strategies in the beta sites will be lost once the
          sites are fully released. Some of our sites remain under active development
          during their Beta release which might require occasional site outages or data re-analysis.
        </div>
      );
    }
  },

  // Blast
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

 // Clinepi home page
  (props) => {
    if ( (props.projectId == 'Gates' || props.projectId == 'ICEMR' || props.projectId == 'ClinEpiDB') && (location.pathname == props.webAppUrl + '/app') ) {
      return (
        <div key="clinepi-astmh">
The EuPathDB and ClinEpiDB team will be attending the <a target='_blank' href='https://www.astmh.org/annual-meeting'>American Society of Tropical Medicine and Hygiene annual meeting</a> next week Sunday, October 28th to Thursday, November 1st! Stop by to see us in the exhibition hall booth 317 & 319 and at Tuesday's Poster Session B  #809.
        </div>
      );
    }
    return null;
  },

  // OrthoMCL enzyme/compound
  (props) => {
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

  // Alt-splice release
/*
  (props) => {
    return props.projectId == 'OrthoMCL' ? null : (
      <div key="alt-splice-release">
Release 29 is an alpha release that includes significant updates to the underlying data and infrastructure. In addition to refreshing all data to the latest versions, we redesigned gene pages, incorporated alternative transcripts into gene pages and searches, and updated search categories.
Please <a className="new-window" data-name="contact_us" href="{props.webAppUrl}/contact.do"> Contact Us</a> to let us know what you think. Release 28 is still available and fully functional.
      </div>
    );
  }
*/
];

/**
 * Info box containing announcements.
 */
export default function Announcements(props) {
  let downAnnouncements = props.announcements.down
    .map(toElement)

  let degradedAnnouncements = props.announcements.degraded
    .map(toElement)

  let infoAnnouncements = props.announcements.information
    .map(toElement)
    .concat(siteAnnouncements.map(invokeWith(props)))   // map to React Elements

  return (
    <div>
      <AnnouncementGroup icon={stopIcon} announcements={downAnnouncements}/>
      <AnnouncementGroup icon={warningIcon} announcements={degradedAnnouncements}/>
      <AnnouncementGroup icon={infoIcon} announcements={infoAnnouncements}/>
    </div>
  );
}

Announcements.propTypes = AnnouncementPropTypes;


/**
 * Box of announcements.
 */
function AnnouncementGroup(props) {
  let finalAnnouncements = props.announcements
    .filter(identity)
    .reduce(injectHr, null);

  return finalAnnouncements !== null && (
    <div className="eupathdb-Announcement" style={{
      padding: '4px',
      border: '1px solid gray',
      margin: '4px',
      background: '#c6dfe3'
    }}>
      <div>
        {props.icon}
        <div style={{
          display: 'inline-block',
          width: 'calc(100% - 70px)',
          padding: '8px',
          verticalAlign: 'middle',
          color: 'darkred',
          fontSize: '1.1em'
        }}>
          {finalAnnouncements}
        </div>
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
function toElement(html) {
  return safeHtml(html, { key: html }, 'div');
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
