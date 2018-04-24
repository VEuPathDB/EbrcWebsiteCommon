import { flow, pick } from 'lodash';
import { withStore, withActions } from '../util/component';
import { UserActionCreators } from 'wdk-client/ActionCreators';
import SiteHeader from '../components/SiteHeader';

const withContext = flow(
  withActions(UserActionCreators),
  withStore(state => state.globalData)
);

/**
 * Wrap Header component with state from store and configured actionCreators
 */
export function Header() {
  return withContext(SiteHeader)
}
