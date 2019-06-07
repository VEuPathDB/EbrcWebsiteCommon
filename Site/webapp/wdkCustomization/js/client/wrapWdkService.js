import { ok } from 'wdk-client/Utils/Json';

export default wdkService => ({
  ...wdkService,
  getStudies: attributes => wdkService.sendRequest(ok, {
    useCache: 'true',
    cacheId: 'studies',
    method: 'post',
    path: wdkService.getStandardSearchReportEndpoint('dataset', 'AllDatasets'),
    body: JSON.stringify({
      searchConfig: { parameters: {} },
      reportConfig: { attributes }
    })
  })
});
