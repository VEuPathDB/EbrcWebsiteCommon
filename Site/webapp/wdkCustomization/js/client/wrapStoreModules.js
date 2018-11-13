import { compose, curryN, set, update } from 'lodash/fp';
import { SITE_CONFIG_LOADED, BASKETS_LOADED, QUICK_SEARCH_LOADED } from './actioncreators/GlobalActionCreators';
import * as contactUs from './store-modules/ContactUsStoreModule';
import {getSearchMenuCategoryTree} from './util/category';
import { selectReporterComponent } from './util/reporter';

import reduceStudies from 'ebrc-client/App/Studies/StudyReducer';
import reduceDataRestriction from 'ebrc-client/App/DataRestriction/DataRestrictionReducer';
import reduceSearchCards from 'ebrc-client/App/Searches/SearchCardReducer';
import { newsReducer } from 'ebrc-client/App/NewsSidebar/NewsModule';


/** Compose reducer functions from right to left */
const composeReducers = (...reducers) => (state, action) =>
  reducers.reduceRight((state, reducer) => reducer(state, action), state);

const composeReducerWith = curryN(2, composeReducers);

export default compose(
  set('searchCards', { key: 'searchCards', reduce: reduceSearchCards }),
  set('studies', { key: 'studies', reduce: reduceStudies }),
  set('dataRestriction', { key: 'dataRestriction', reduce: reduceDataRestriction }),
  set('newsSidebar', { key: 'newsSidebar', reduce: newsReducer }),
  set('contactUs', contactUs),
  update('globalData.reduce', composeReducerWith(ebrcGlobalData)),
  update('downloadForm', module => ({ ...module, reduce: module.makeReducer(selectReporterComponent) }))
);

function ebrcGlobalData(state, { type, payload }) {
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