import { flow, pick } from 'lodash';
import React from 'react';
import { withStore, withActions } from '../util/component';
import { UserActionCreators } from 'wdk-client/ActionCreators';
import SiteHeader from '../components/SiteHeader';
import CookieBanner from '../components/CookieBanner';

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

const SiteHeaderWithContext = flow(
  withActions(UserActionCreators),
  withStore(state => pick(state.globalData, globalDataItems))
)(SiteHeader);

/**
 * Wrap Header component with state from store and configured actionCreators
 */
export function Header() {
  return () => (
    <div>
      <SiteHeaderWithContext/>
      <CookieBanner/>
    </div>
  );
}
