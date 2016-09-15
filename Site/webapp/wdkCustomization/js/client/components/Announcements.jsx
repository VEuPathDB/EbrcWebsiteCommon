import { PropTypes } from 'react';
import { identity } from 'lodash';

const AnnouncementPropTypes = {
  projectId: PropTypes.string.isRequired,
  webAppUrl: PropTypes.string.isRequired
};

// Array of announcements to show. Each element of the array is a function that takes props
// and returns a React Element. Use props as an opportunity to determine if the message should
// be displayed for the given context.
const announcements = [
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
  },

  // Alt-splice release
  (props) => {
    return props.projectId == 'OrthoMCL' ? null : (
      <div key="alt-splice-release">
        This {props.projectId} has been significantly upgraded. In addition to a
        refresh of all data to the latest versions, the site reflects a large
        development effort to upgrade many website and data features
        (see the <a href="{props.webAppUrl}/showXmlDataContent.do?name=XmlQuestions.News">Release Notes</a>).
        Please explore the site and <a className="new-window" data-name="contact_us"
          href="{props.webAppUrl}/contact.do"> Contact Us</a> with your feedback.
        Previous database available at <a href={'http://r28.' +
          location.hostname.split('.').slice(-2).join('.')}>
          {props.projectId} Release 28</a>.
      </div>
    );
  }
];

/**
 * Info box containing announcements.
 */
export default function Announcements(props) {
    let finalAnnouncements = announcements
      .map(invokeWith(props))  // map to React Elements
      .filter(identity)        // filter out falsey values (e.g., null)
      .reduce(injectHr, null); // interweave <hr/> elements

  return finalAnnouncements && (
    <div className="eupathdb-Announcement" style={{
      padding: '4px',
      border: '1px solid gray',
      margin: '4px',
      background: '#cdd9eb'
    }}>
      <div>
        <span className="fa-stack fa-2x">
          <i className="fa fa-circle fa-stack-2x" style={{color: '#004aff'}}/>
          <i className="fa fa-info fa-stack-1x" style={{color: 'white'}}/>
        </span>
        <div style={{
          display: 'inline-block',
          width: 'calc(100% - 70px)',
          padding: '8px',
          verticalAlign: 'middle',
          color: 'darkred',
          fontSize: '1.2em'
        }}>
          {finalAnnouncements}
        </div>
      </div>
    </div>
  );
}

Announcements.propTypes = AnnouncementPropTypes;

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
