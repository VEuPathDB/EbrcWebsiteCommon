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
  'location',
  'siteConfig'
];

const withContext = flow(
  withActions(UserActionCreators),
  withStore(state => pick(state.globalData, globalDataItems))
);

/**
 * Wrap Header component with state from store and configured actionCreators
 */
export function Header() {
  return withContext(SiteHeader)
}
