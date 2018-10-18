import React from 'react';
import { connect } from 'react-redux';
import { UserActionCreators } from 'wdk-client/ActionCreators';
import SiteHeader from '../components/SiteHeader';
import CookieBanner from '../components/CookieBanner';
import { makeMenuItems } from '../util/menuItems';

/**
 * Wrap Header component with state from store and configured actionCreators
 */
export const makeHeaderWrapper = ({ makeMainMenuItems, makeSmallMenuItems }) => () => {
  const SiteHeaderWithContext = connect(
    (state) => {
      const { globalData } = state;
      const menuItems = makeMenuItems(globalData);
      const mainMenuItems = makeMainMenuItems && makeMainMenuItems(globalData, menuItems);
      const smallMenuItems = makeSmallMenuItems && makeSmallMenuItems(globalData, menuItems);
      return { ...globalData, mainMenuItems, smallMenuItems };
    },
    UserActionCreators,
  )(SiteHeader);
  return () => (
    <React.Fragment>
      <SiteHeaderWithContext/>
      <CookieBanner/>
    </React.Fragment>
  );
}
