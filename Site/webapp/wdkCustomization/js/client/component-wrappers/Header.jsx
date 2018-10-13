import React from 'react';
import { connect } from 'react-redux';
import { UserActionCreators } from 'wdk-client/ActionCreators';
import SiteHeader from '../components/SiteHeader';
import CookieBanner from '../components/CookieBanner';

const SiteHeaderWithContext = connect(
  state => state.globalData,
  UserActionCreators,
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
