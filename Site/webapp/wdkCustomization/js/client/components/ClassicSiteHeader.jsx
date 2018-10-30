import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { UserActionCreators } from 'wdk-client/ActionCreators';
import { Sticky } from 'wdk-client/Components';
import { formatReleaseDate } from '../util/formatters';
import { makeMenuItems } from '../util/menuItems';
import Announcements from './Announcements';
import QuickSearch from './QuickSearch';
import SmallMenu from './SmallMenu';
import Menu from './Menu';
import { loadBasketCounts, loadQuickSearches } from '../actioncreators/GlobalActionCreators';

/** Site header */
const enhance = connect(
  (state) => state.globalData,
  { ...UserActionCreators, loadBasketCounts, loadQuickSearches }
);

class ClassicSiteHeader extends React.Component {

  componentDidMount() {
    const { quickSearchReferences } = this.props;
    if (quickSearchReferences != null) this.props.loadQuickSearches(quickSearchReferences);
    this.props.loadBasketCounts();
  }

  render () {
    const {
      quickSearches,
      quickSearchReferences,
      user,
      showLoginWarning,
      location = window.location,
      siteConfig,
      makeSmallMenuItems,
      makeMainMenuItems,
      isPartOfEuPathDB = true,
    } = this.props;

    const {
      announcements,
      buildNumber,
      projectId,
      releaseDate,
      webAppUrl,
    } = siteConfig;

    const menuItems = makeMenuItems(this.props);
    const mainMenuItems = makeMainMenuItems && makeMainMenuItems(this.props, menuItems);
    const smallMenuItems = makeSmallMenuItems && makeSmallMenuItems(this.props, menuItems);

    return (
      <div>
        <div id="header">
          <div id="header2">
            <div id="header_rt">
              <div id="private-Logo">
                <a target=":blank" href="http://www.vet.upenn.edu">
                  <img width="210px" src={webAppUrl + '/images/PrivateLogo.png'}/>
                </a></div>
              <div id="toplink">
                {isPartOfEuPathDB &&
                  <a href="http://eupathdb.org">
                    <img alt="Link to EuPathDB homepage" src={webAppUrl + '/images/' + projectId + '/partofeupath.png'}/>
                  </a>
                }
              </div>
              <QuickSearch
                webAppUrl={webAppUrl}
                references={quickSearchReferences}
                questions={quickSearches}
              />
              <SmallMenu
                webAppUrl={webAppUrl}
                items={smallMenuItems}
              />
            </div>
            <div className="eupathdb-Logo">
              <a href="/">
                <img className="eupathdb-LogoImage" alt={"Link to " + projectId + " homepage"} src={webAppUrl + "/images/" + projectId + "/title_s.png"}/>
              </a>
              <span className="eupathdb-LogoRelease">
                Release {buildNumber}
                <br/>
                {formatReleaseDate(releaseDate)}
              </span>
            </div>
          </div>
          {/* TODO Put items into an external JSON file. */}
          <Sticky>
            {({isFixed}) => (
              <div className={'eupathdb-MenuContainer' + (
                isFixed ? ' eupathdb-MenuContainer__fixed' : '')}>
                <Menu
                  webAppUrl={webAppUrl}
                  projectId={projectId}
                  showLoginWarning={showLoginWarning}
                  isGuest={user ? user.isGuest : true}
                  items={mainMenuItems}/>
              </div>
            )}
          </Sticky>
        </div>
        <Announcements projectId={projectId} webAppUrl={webAppUrl} location={location} announcements={announcements}/>
      </div>
    );
  }
}

ClassicSiteHeader.propTypes = {
  // Global data items
  user: PropTypes.object,
  ontology: PropTypes.object,
  recordClasses: PropTypes.array,
  basketCounts: PropTypes.object,
  quickSearches: QuickSearch.propTypes.questions,
  quickSearchReferences: PropTypes.array,
  preferences: PropTypes.object,
  location: PropTypes.object,
  siteConfig: PropTypes.object.isRequired,

  showLoginForm: PropTypes.func.isRequired,
  showLoginWarning: PropTypes.func.isRequired,
  showLogoutWarning: PropTypes.func.isRequired,
  makeSmallMenuItems: PropTypes.func,
  makeMainMenuItems: PropTypes.func,
  loadBasketCounts: PropTypes.func.isRequired,
  loadQuickSearches: PropTypes.func.isRequired,
};

export default enhance(ClassicSiteHeader);
