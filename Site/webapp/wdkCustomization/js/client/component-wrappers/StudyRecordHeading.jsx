import { get } from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import { Seq } from 'wdk-client/IterableUtils';
import { makeClassNameHelper } from 'wdk-client/ComponentUtils';
import StudySearches from 'ebrc-client/App/Studies/StudySearches';
import DownloadLink from 'ebrc-client/App/Studies/DownloadLink';
import { attemptAction } from 'ebrc-client/App/DataRestriction/DataRestrictionActionCreators';
import { set } from 'lodash/fp';

import './StudyRecordHeading.scss';

const cx = makeClassNameHelper('StudyRecordHeadingSearchLinks');

function StudyRecordHeading({ showSearches = false, showDownload = false, entries, loading, webAppUrl, study, attemptAction, ...props }) {
  let newProps = set(['recordClass','displayName'],'Study', props); 
  return (
    <React.Fragment>
      <props.DefaultComponent {...newProps}/>
      {showSearches && (
        <div className={cx()}>
          <div className={cx('Label')}>Search the data</div>
          {loading ? null :
            <StudySearches
              study={study}
              webAppUrl={webAppUrl}
              renderNotFound={() => (
                <div>
                  <em>No searches were found for this study.</em>
                </div>
              )}
            />
          }
        </div>
      )}
      {showDownload && (
        <div className={cx()}>
          <div className={cx('Label')}>Download the data</div>
          { study && showDownload && <DownloadLink className="StudySearchIconLinksItem" studyId={study.id} studyUrl={study.downloadUrl.url} attemptAction={attemptAction}/> }
        </div>
      )}
    </React.Fragment>
  );
}

function mapStateToProps(state) {
  const { globalData, record, studies } = state;
  const { siteConfig } = globalData;
  const { webAppUrl } = siteConfig;

  if (studies.loading) {
    return { loading: true };
  }

  const studyId = record.record.id
    .filter(part => part.name === 'dataset_id')
    .map(part => part.value)[0];

  const study = get(studies, 'entities', [])
    .find(study => study.id === studyId);
  return { webAppUrl, study };
}

const mapDispatchToProps = {
  attemptAction
};

export default connect(mapStateToProps, mapDispatchToProps)(StudyRecordHeading);