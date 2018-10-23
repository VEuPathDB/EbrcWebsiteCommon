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
    (state) => state.globalData,
    UserActionCreators,
    (globalData, userActionCreators) => {
      const finalProps = { ...globalData, ...userActionCreators };
      const menuItems = makeMenuItems(finalProps);
      const mainMenuItems = makeMainMenuItems && makeMainMenuItems(finalProps, menuItems);
      const smallMenuItems = makeSmallMenuItems && makeSmallMenuItems(finalProps, menuItems);
      return { ...finalProps, mainMenuItems, smallMenuItems };
    }
  )(SiteHeader);
  return () => (
    <React.Fragment>
      <SiteHeaderWithContext/>
      <CookieBanner/>
    </React.Fragment>
  );
}
