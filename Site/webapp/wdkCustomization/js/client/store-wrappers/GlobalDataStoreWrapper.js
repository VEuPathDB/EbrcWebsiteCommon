import { BASKETS_LOADED, QUICK_SEARCH_LOADED } from '../actioncreators/GlobalActionCreators';

export default (GlobalDataStore) => class EuPathDBGlobalDataStore extends GlobalDataStore {
  handleAction(state, { type, payload }) {
    switch(type) {
      case BASKETS_LOADED: return Object.assign({}, state, {
        basketCounts: payload.basketCounts
      });

      case QUICK_SEARCH_LOADED: return Object.assign({}, state, {
        quickSearches: payload.questions,
        quickSearchesLoading: false
      });

      default: return state;
    }
  }
}
