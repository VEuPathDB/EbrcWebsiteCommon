import * as React from 'react';
import { selectReporterComponent } from '../util/reporter';

export function DownloadForm() {
  return function EupathDownloadForm(props) {
    let Reporter = selectReporterComponent(props.selectedReporter, props.recordClass.name);
    return (
      <div>
        <hr/>
        <Reporter {...props}/>
      </div>
    );
  }
}
