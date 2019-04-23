import { keyBy, get } from 'lodash';

import { fetchStudies } from 'ebrc-client/App/Studies/StudyActionCreators';

export const SEARCHES_LOADING = 'search-cards/loading';
export const SEARCHES_LOADED = 'search-cards/loaded';
export const SEARCHES_ERROR = 'search-cards/error';

export const loadSearches = (userEmails) => ({ wdkService }) => [
  { type: SEARCHES_LOADING },
  fetchAndFormatSearches(wdkService, userEmails).then(
    searches => ({ type: SEARCHES_LOADED, payload: { searches }}),
    error => ({ type: SEARCHES_ERROR, payload: { error: error.message }})
  )
]

async function fetchAndFormatSearches(wdkService, userEmails) {
  const [ recordClasses, strategies, [ studies ] ] = await Promise.all([
    wdkService.getRecordClasses(),
    userEmails
      ? wdkService.getPublicStrategies({ userEmail: userEmails })
      : wdkService.getPublicStrategies(),
    fetchStudies(wdkService)
  ]);

  const recordClassesByFullName = keyBy(recordClasses, 'fullName');

  return strategies
    .filter(strategy => strategy.isValid)
    .map(strategy => ({
      icon: get(recordClassesByFullName[strategy.recordClassName], 'iconName', 'question'),
      recordClassDisplayName: get(recordClassesByFullName[strategy.recordClassName], 'displayNamePlural', 'Uknown record type'),
      name: strategy.name,
      studyName: getStudyNameByRecordClassName(studies, strategy.recordClassName),
      appUrl: `/im.do?s=${strategy.signature}`,
      description: strategy.description
    }))
}

function getStudyNameByRecordClassName(studies, recordClassName) {
  const study = studies.find(study => recordClassName.startsWith(study.id));
  return study && study.name;
}
