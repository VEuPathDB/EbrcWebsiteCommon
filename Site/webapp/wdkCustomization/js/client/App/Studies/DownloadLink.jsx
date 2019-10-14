import React from 'react';
import { IconAlt as Icon, Mesa } from 'wdk-client/Components';

export default function DownloadLink(props) {
  const { attemptAction, studyId, studyUrl, className, linkText = '' } = props;
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
    </div>
  );
}
