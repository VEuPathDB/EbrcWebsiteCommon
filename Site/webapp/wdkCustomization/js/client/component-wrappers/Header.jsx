import { flow } from 'lodash';
import React from 'react';
import { withStore, withActions } from '../util/component';
import { UserActionCreators } from 'wdk-client/ActionCreators';
import SiteHeader from '../components/SiteHeader';
import CookieBanner from '../components/CookieBanner';

const SiteHeaderWithContext = flow(
  withActions(UserActionCreators),
  withStore(state => state.globalData)
)(SiteHeader);

/**
 * Wrap Header component with state from store and configured actionCreators
 */
export function Header() {
  return () => (
    <React.Fragment>
      <SiteHeaderWithContext/>
      <CookieBanner/>
    </React.Fragment>
  );
}
