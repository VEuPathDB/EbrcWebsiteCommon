import { ok } from 'wdk-client/Utils/Json';

export default WdkService => class EbrcWdkService extends WdkService {

  getStudies(attributes) {
    return this.sendRequest(ok, {
      useCache: 'true',
      cacheId: 'studies',
      method: 'post',
      path: this.getAnswerJsonServicePath(),
      body: JSON.stringify({
        answerSpec: {
          filters: [],
          parameters: {},
          questionName: 'DatasetQuestions.AllDatasets'
        },
        formatConfig: { attributes }
      })
    })
  }

}
