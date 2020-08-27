import { get } from 'lodash';
import React from 'react';
import { connect, useSelector } from 'react-redux';
import { makeClassNameHelper } from 'wdk-client/Utils/ComponentUtils';
import StudySearches from 'ebrc-client/App/Studies/StudySearches';
import DownloadLink from 'ebrc-client/App/Studies/DownloadLink';
import { attemptAction } from 'ebrc-client/App/DataRestriction/DataRestrictionActionCreators';
import { isPrereleaseStudy } from 'ebrc-client/App/DataRestriction/DataRestrictionUtils';
import './StudyRecordHeading.scss';

const cx = makeClassNameHelper('StudyRecordHeadingSearchLinks');

function StudyRecordHeading({ showSearches = false, showDownload = false, entries, loading, study, attemptAction, ...props }) {
  const user = useSelector(state => state.globalData.user);

  return (
    <React.Fragment>
      <props.DefaultComponent {...props}/>
      {study != null &&  showSearches && (!isPrereleaseStudy(study.access, study.id, user)) && (
        <div className={cx()}>
          <div className={cx('Label')}>Search the data</div>
          {loading ? null :
            <StudySearches
              study={study}
              renderNotFound={() => (
                <div>
                  <em>No searches were found for this study.</em>
                </div>
              )}
            />
          }
        </div>
      )}
      {isPrereleaseStudy(study.access, study.id, user) && (
        <div style={{backgroundColor:'lightblue',padding:'0.5em', fontSize:'1.8em',margin:'1.5em 0 0'}} className='record-page-banner'>
          This study has not yet been released. <span style={{fontSize:'80%'}}>
            For more information, please email {props.record.attributes.contact} at <a href={"mailto:" + study.email}>{study.email}</a>.</span>
        </div>
      )}
      {showDownload && (!isPrereleaseStudy(study.access, study.id, user)) && (
        <div className={cx()}>
          <div className={cx('Label')}>Download the data</div>
          { study && showDownload && <DownloadLink className="StudySearchIconLinksItem" studyId={study.id} studyUrl={study.downloadUrl.url} attemptAction={attemptAction}/> }
        </div>
      )}
    </React.Fragment>
  );
}

function mapStateToProps(state) {
  const { record, studies } = state;

  if (studies.loading) {
    return { loading: true };
  }

  const studyId = record.record.id
    .filter(part => part.name === 'dataset_id')
    .map(part => part.value)[0];

  const study = get(studies, 'entities', [])
    .find(study => study.id === studyId);
  return { study };
}

const mapDispatchToProps = {
  attemptAction
};

export default connect(mapStateToProps, mapDispatchToProps)(StudyRecordHeading);
