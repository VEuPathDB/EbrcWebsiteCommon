import { selectReporterComponent } from '../util/reporter';

/** Return subcass of the provided DownloadFormStore */
export default (DownloadFormStore) => class EupathDownloadFormStore extends DownloadFormStore {
  getSelectedReporter(selectedReporterName, recordClassName) {
    return selectReporterComponent(selectedReporterName, recordClassName);
  }
}
