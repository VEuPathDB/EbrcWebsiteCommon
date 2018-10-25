import { keyBy, get } from 'lodash';

import { fetchStudies } from 'ebrc-client/App/Studies/StudyActionCreators';

export const SEARCHES_LOADING = 'search-cards/loading';
export const SEARCHES_LOADED = 'search-cards/loaded';
export const SEARCHES_ERROR = 'search-cards/error';

export const loadSearches = () => ({ wdkService }) => [
  { type: SEARCHES_LOADING },
  fetchAndFormatSearches(wdkService).then(
    searches => ({ type: SEARCHES_LOADED, payload: { searches }}),
    error => ({ type: SEARCHES_ERROR, payload: { error: error.message }})
  )
]

async function fetchAndFormatSearches(wdkService) {
  const [ recordClasses, strategies, [ studies ] ] = await Promise.all([
    wdkService.getRecordClasses(),
    wdkService.getPublicStrategies({ userEmail: ['eupathdb@gmail.com'] }),
    fetchStudies(wdkService)
  ]);

  const recordClassesByName = keyBy(recordClasses, 'name');

  return strategies
    .filter(strategy => strategy.isValid)
    .map(strategy => ({
      icon: get(recordClassesByName[strategy.recordClassName], 'iconName', 'question'),
      recordClassDisplayName: get(recordClassesByName[strategy.recordClassName], 'displayNamePlural', 'Uknown record type'),
      studyName: getStudyNameByRecordClassName(studies, strategy.recordClassName),
      appUrl: `/im.do?s=${strategy.signature}`,
      description: strategy.description
    }))
}

function getStudyNameByRecordClassName(studies, recordClassName) {
  const study = studies.find(study => recordClassName.startsWith(study.id));
  return study && study.name;
}
