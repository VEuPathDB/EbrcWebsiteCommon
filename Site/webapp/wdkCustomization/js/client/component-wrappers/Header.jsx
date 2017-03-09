import { flow, pick } from 'lodash';
import { withStore, withActions } from '../util/component';
import { UserActionCreators } from 'wdk-client/ActionCreators';
import SiteHeader from '../components/SiteHeader';

const globalDataItems = [
  'user',
  'ontology',
  'recordClasses',
  'basketCounts',
  'quickSearches',
  'preferences',
  'location'
];

/**
 * Create a Wdk component wrapper with options
 *
 * @param {Object} options
 * @param {Object} options.siteConfig
 * @param {boolean} options.isPartOfEuPathDB
 * @param {boolean} options.flattenSearches
 * @param {boolean} options.includeQueryGrid
 * @param {Array} options.additionalMenuEntries
 */
export default function makeHeaderWrapper(options) {
  if (options === undefined)
    throw new Error("Header `options` must be defined.");

  if (options.siteConfig === undefined)
    throw new Error("Header `options.siteConfig` must be defined.");

  return () => flow(
    withActions(UserActionCreators),
    withStore(state => Object.assign(pick(state.globalData, globalDataItems), options))
  )(SiteHeader)
}
