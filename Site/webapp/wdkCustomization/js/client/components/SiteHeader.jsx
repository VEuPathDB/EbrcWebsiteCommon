import PropTypes from 'prop-types';
import { Sticky } from 'wdk-client/Components';
import { wrappable } from 'wdk-client/ComponentUtils';
import { formatReleaseDate } from '../util/formatters';
import Announcements from './Announcements';
import QuickSearch from './QuickSearch';
import SmallMenu from './SmallMenu';
import Menu from './Menu';

/** Site header */
function Header(props) {
  const {
    quickSearches,
    user,
    showLoginWarning,
    location = window.location,
    siteConfig,
    smallMenuItems,
    mainMenuItems,
  } = props;

  const {
    isPartOfEuPathDB = true,
    quickSearchReferences,
    announcements,
    buildNumber,
    projectId,
    releaseDate,
    webAppUrl,
  } = siteConfig;

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

Header.propTypes = {
  // Global data items
  user: PropTypes.object,
  ontology: PropTypes.object,
  recordClasses: PropTypes.array,
  basketCounts: PropTypes.object,
  quickSearches: QuickSearch.propTypes.questions,
  preferences: PropTypes.object,
  location: PropTypes.object,
  showLoginForm: PropTypes.func.isRequired,
  showLoginWarning: PropTypes.func.isRequired,
  showLogoutWarning: PropTypes.func.isRequired,
  siteConfig: PropTypes.object.isRequired
};

export default wrappable(Header);
