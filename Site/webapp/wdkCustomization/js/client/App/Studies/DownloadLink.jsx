import React from 'react';
import { IconAlt as Icon, Mesa } from 'wdk-client/Components';
import { attemptAction } from 'ebrc-client/App/DataRestriction/DataRestrictionActionCreators'
import { connect } from 'react-redux'
import { isPrereleaseStudy } from 'ebrc-client/App/DataRestriction/DataRestrictionUtils';

function DownloadLink(props) {
  const { attemptAction, studyAccess, studyId, studyUrl, user, className, linkText = '' } = props;
  const myDownloadTitle = "Download data files";
  return (
    <div className={className}> 
      { !isPrereleaseStudy(studyAccess, studyId, user)
        ? <Mesa.AnchoredTooltip
        fadeOut
        content={myDownloadTitle}>
        <button
          type="button"
          className="link"
          onClick={(event) => {
            const { ctrlKey } = event;
            attemptAction('download', {
              studyId: studyId,
              onAllow: () => {
                if (ctrlKey) window.open(studyUrl, '_blank');
                else window.location.assign(studyUrl)
              }
            });
          }}>
          {linkText} <Icon fa="download" />
        </button>
        </Mesa.AnchoredTooltip>
        : <span>&nbsp;</span>
      }
    </div>
  );
}
// expression (not declaration): we are calling connect
// arg1: mapStateToProps: take state from store and pass to component as props
// arg2: mapDispatchToProps: pass an object with one property 'attemptAction' which is an actionCreator (because it returns a run() function) see DataRestrictionActionCreators
// attemptAction gets bound to the store, the store receives the action, which will get executed when user clicks.
export default connect( state => ({user: state.globalData.user}) ,{ attemptAction })(DownloadLink);
