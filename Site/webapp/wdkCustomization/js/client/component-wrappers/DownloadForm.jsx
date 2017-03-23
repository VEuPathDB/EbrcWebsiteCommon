import * as React from 'react';

export default (selectReporterComponent) => (DefaultComponent) =>
  function EupathDownloadForm(props) {
    let Reporter = selectReporterComponent(props.selectedReporter, props.recordClass.name);
    return (
      <div>
        <hr/>
        <Reporter {...props}/>
      </div>
    );
  }
