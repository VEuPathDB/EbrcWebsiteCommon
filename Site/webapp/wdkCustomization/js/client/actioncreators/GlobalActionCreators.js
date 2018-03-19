/**
 * Created by dfalke on 8/22/16.
 */
import { keyBy } from 'lodash';
import { broadcast } from 'wdk-client/StaticDataUtils';
import { emptyAction } from 'wdk-client/ActionCreatorUtils';

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
  return function run({ wdkService }) {
    return wdkService.getCurrentUser().then(user => {
      return user.isGuest
        ? emptyAction
        : wdkService.getBasketCounts().then(basketCounts => broadcast({
          type: BASKETS_LOADED,
          payload: { basketCounts }
        }));
    })
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
  return function run({ wdkService }) {
    let requests = questions.map(reference =>
      wdkService.getQuestionAndParameters(reference.name));
    return Promise.all(requests).then(
      questions => keyBy(questions, 'name'),
      error => error
    ).then(questions =>
      broadcast({
        type: QUICK_SEARCH_LOADED,
        payload: { questions: questions }
      })
    );
  }
}
