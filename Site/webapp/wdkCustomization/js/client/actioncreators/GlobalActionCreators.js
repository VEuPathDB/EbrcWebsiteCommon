/**
 * Created by dfalke on 8/22/16.
 */
import { keyBy } from 'lodash';
import { broadcast } from 'wdk-client/StaticDataUtils';

export const SITE_CONFIG_LOADED = 'eupathdb/site-config-loaded';
export const BASKETS_LOADED = 'eupathdb/basket'
export const QUICK_SEARCH_LOADED = 'eupathdb/quick-search-loaded'

export function loadSiteConfig(siteConfig) {
  return broadcast({
    type: SITE_CONFIG_LOADED,
    payload: { siteConfig }
  })
}

export function loadBasketCounts() {
  return function run(dispatch, { wdkService }) {
    wdkService.getCurrentUser().then(user => {
      if (user.isGuest) return;
      wdkService.getBasketCounts().then(basketCounts => {
        dispatch(broadcast({
          type: BASKETS_LOADED,
          payload: { basketCounts }
        }));
      })
      .catch(error => {
        if (error.status !== 403) {
          console.error('Unexpected error while attempting to retrieve basket counts.', error);
        }
      });
    });
  };
}

/**
 * Load data for quick search
 * @param {Array<object>} questions An array of quick search spec objects.
 *    A spec object has two properties: `name`: the name of the questions,
 *    and `searchParam`: the name of the parameter to use for text box.
 * @return {run}
 */
export function loadQuickSearches(questions) {
  return function run(dispatch, { wdkService }) {
    let requests = questions.map((reference) => {
      return wdkService.sendRequest({
        method: 'GET',
        path: '/question/' + reference.name,
        params: { expandParams: true },
        useCache: true
      });
    });
    return Promise.all(requests).then(
      questions => keyBy(questions, 'name'),
      error => error
    ).then(questions =>
      dispatch(broadcast({
        type: QUICK_SEARCH_LOADED,
        payload: { questions: questions }
      }))
    );
  }
}
