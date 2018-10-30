import React from 'react';
import { connect } from 'react-redux';
import SiteHeader from '../components/SiteHeader';
import CookieBanner from '../components/CookieBanner';
import Announcements from '../components/Announcements';


/**
 * Wrap Header component with state from store and configured actionCreators
 */
export const Header = () => {
  return connect(
    state => ({
      announcements: state.globalData.siteConfig.announcements,
      projectId: state.globalData.siteConfig.projectId,
      webAppUrl: state.globalData.siteConfig.webAppUrl,
      location: window.location
    })
  )(announcementProps => (
    <React.Fragment>
      <SiteHeader/>
      <Announcements {...announcementProps} />
      <CookieBanner/>
    </React.Fragment>
  ));
}