import { parseSearchQueryString, areTermsInString } from 'wdk-client/Utils/SearchUtils';

export function studyMatchPredicate(searchString, filterString) {
  const terms = parseSearchQueryString(filterString);
  return areTermsInString(terms, searchString);
}
