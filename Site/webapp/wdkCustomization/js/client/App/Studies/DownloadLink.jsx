import React from 'react';
import { IconAlt as Icon, Mesa } from 'wdk-client/Components';

export default function DownloadLink(props) {
  const { attemptAction, study, className, linkText = '' } = props;
  const myDownloadTitle = "Download data files";
  return (
    <div className={className}> 
      <Mesa.AnchoredTooltip
        fadeOut
        content={myDownloadTitle}>
        <button
          type="button"
          className="link"
          onClick={(event) => {
            const { ctrlKey } = event;
            attemptAction('download', {
              studyId: study.id,
              onAllow: () => {
                if (ctrlKey) window.open(study.downloadUrl.url, '_blank');
                else window.location.assign(study.downloadUrl.url)
              }
            });
          }}>
          {linkText} <Icon fa="download" />
        </button>
      </Mesa.AnchoredTooltip>
    </div>
  );
}
