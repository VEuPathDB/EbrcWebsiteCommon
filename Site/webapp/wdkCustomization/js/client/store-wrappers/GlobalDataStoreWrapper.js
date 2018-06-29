import { SITE_CONFIG_LOADED, BASKETS_LOADED, QUICK_SEARCH_LOADED } from '../actioncreators/GlobalActionCreators';
import {getSearchMenuCategoryTree} from '../util/category';

export const GlobalDataStore = (GlobalDataStore) => class EuPathDBGlobalDataStore extends GlobalDataStore {
  handleAction(state, { type, payload }) {
    switch(type) {
      case SITE_CONFIG_LOADED: return Object.assign({}, state, {
        siteConfig: payload.siteConfig
      });

      case BASKETS_LOADED: return Object.assign({}, state, {
        basketCounts: payload.basketCounts
      });

      case QUICK_SEARCH_LOADED: return Object.assign({}, state, {
        quickSearches: payload.questions,
        quickSearchesLoading: false
      });

      case 'static/all-data-loaded': return {
        ...state,
        searchTree: getSearchMenuCategoryTree(state.ontology, state.recordClasses)
      };

      default: return state;
    }
  }
}
