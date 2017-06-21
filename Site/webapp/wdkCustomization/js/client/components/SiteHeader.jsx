import { add, reduce,keyBy } from 'lodash';
import PropTypes from 'prop-types';
import { getId, getDisplayName, getTargetType, isIndividual } from 'wdk-client/CategoryUtils';
import { Sticky } from 'wdk-client/Components';
import { wrappable } from 'wdk-client/ComponentUtils';
import { preorderSeq } from 'wdk-client/TreeUtils';
import { formatReleaseDate } from '../util/formatters';
import { getSearchMenuCategoryTree } from '../util/category';
import Announcements from './Announcements';
import QuickSearch from './QuickSearch';
import SmallMenu from './SmallMenu';
import Menu from './Menu';

/** Site header */
function Header(props) {
  const {
    quickSearchReferences,
    quickSearches,
    user,
    showLoginWarning,
    location,
    isPartOfEuPathDB,
    mainMenuItems,
    smallMenuItems,
    siteConfig
  } = props;

  const {
    announcements,
    buildNumber,
    projectId,
    releaseDate,
    webAppUrl
  } = siteConfig;

  const menuItems = makeMenuItems(props);

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
              items={smallMenuItems(props, menuItems)}
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
        <Sticky className="eupathdb-MenuContainer" fixedClassName="eupathdb-MenuContainer__fixed">
          <Menu
            webAppUrl={webAppUrl}
            projectId={projectId}
            showLoginWarning={showLoginWarning}
            isGuest={user ? user.isGuest : true}
            items={mainMenuItems(props, menuItems)}/>
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
  quickSearchReferences: PropTypes.array,
  quickSearches: PropTypes.object,
  preferences: PropTypes.object,
  location: PropTypes.object,
  showLoginForm: PropTypes.func.isRequired,
  showLoginWarning: PropTypes.func.isRequired,
  showLogoutWarning: PropTypes.func.isRequired,
  siteConfig: PropTypes.object.isRequired,
  includeQueryGrid: PropTypes.bool,
  isPartOfEuPathDB: PropTypes.bool,
  flattenSearches: PropTypes.bool,
  mainMenuItems: PropTypes.func,
  smallMenuItems: PropTypes.func
};

Header.defaultProps = {
  includeQueryGrid: true,
  isPartOfEuPathDB: true,
  flattenSearches: false,
  mainMenuItems: () => [],
  smallMenuItems: () => [],
  location: window.location
};

export default wrappable(Header);


// helpers

/**
 * Map search tree to menu items. If flatten is true, return a flat
 * list of search items. Otherwise, return the full tree of search
 * items.
 */
function getSearchItems(ontology, recordClasses, flatten = false) {
  if (ontology == null || recordClasses == null) return [];
  let tree = getSearchMenuCategoryTree(ontology, recordClasses, {});
  return flatten ? preorderSeq(tree).filter(isIndividual).map(createMenuItem)
                 : tree.children.map(createMenuItem);
}

/** Map a search node to a meny entry */
function createMenuItem(searchNode) {
  return {
    id: getId(searchNode),
    text: getDisplayName(searchNode),
    children: searchNode.children.map(createMenuItem),
    webAppUrl: getTargetType(searchNode) === 'search' &&
      '/showQuestion.do?questionFullName=' + getId(searchNode)
  };
}

/**
 * Common menu items used by our sites.
 * Some are used in the small menu, and some in the main menu.
 * We collect them here to allow the specific site to decide where and
 * how to use them.
 *
 * This is imperfect, but what it provides is the construction of the most
 * common set of menu items used across our sites, allowing each site to
 * modify or extend the data structure at will.
 *
 * Note, each top-level entry has a unique id. This can be leveraged to alter
 * the final structure of the menu items.
 */
function makeMenuItems(props) {
  const {
    basketCounts,
    user,
    siteConfig,
    ontology,
    recordClasses,
    showLoginForm,
    showLogoutWarning,
    includeQueryGrid,
    flattenSearches
  } = props;

  const {
    facebookUrl,
    twitterUrl,
    youtubeUrl,
    webAppUrl
  } = siteConfig;

  const totalBasketCount = reduce(basketCounts, add, 0);

  const isLoggedIn = user && !user.isGuest;

  return keyBy( [
    { id: 'home', text: 'Home', tooltip: 'Go to the home page', url: webAppUrl },
    { id: 'search', text: 'New Search', tooltip: 'Start a new search strategy',
      children: getSearchItems(ontology, recordClasses, flattenSearches).concat(
        includeQueryGrid ? [
          { id: 'query-grid', text: 'View all available searches', route: 'query-grid' }
        ] : [])
    },
    { id: 'strategies', text: 'My Strategies',  webAppUrl: '/showApplication.do' },
    {
      id: 'basket',
      text: <span>My Basket <span style={{ color: '#600000' }}>({totalBasketCount})</span></span>,
      webAppUrl: '/showApplication.do?tab=basket',
      loginRequired: true
    },
    {
      id: 'favorites',
      text: 'My Favorites',
      webAppUrl: '/showFavorite.do',
      loginRequired: true
    },

    isLoggedIn ? {
      id: 'profileOrLogin',
      text: `${user.firstName} ${user.lastName}'s Profile`,
      route: 'user/profile'
    } : {
      id: 'profileOrLogin',
      text: 'Login',
      url: '#login',
      onClick: e => { e.preventDefault(); showLoginForm(); }
    },

    isLoggedIn ? {
      id: 'registerOrLogout',
      text: 'Logout',
      url: '#logout',
      onClick: e => { e.preventDefault(); showLogoutWarning(); }
    } : {
      id: 'registerOrLogout',
      text: 'Register',
      webAppUrl: '/showRegister.do'
    },
    {
      id: 'contactUs',
      text: 'Contact Us',
      webAppUrl: '/contact.do',
      target: '_blank'
    }
  ]
    .concat(twitterUrl ? {
      id: 'twitter',
      liClassName: 'eupathdb-SmallMenuSocialMediaContainer',
      className: 'eupathdb-SocialMedia eupathdb-SocialMedia__twitter',
      url: twitterUrl,
      title: 'Follow us on Twitter!',
      target: '_blank'
    } : [])
    .concat(facebookUrl ? {
      id: 'facebook',
      liClassName: 'eupathdb-SmallMenuSocialMediaContainer',
      className: 'eupathdb-SocialMedia eupathdb-SocialMedia__facebook',
      url: facebookUrl,
      title: 'Follow us on Facebook!',
      target: '_blank'
    } : [])
    .concat(youtubeUrl ? {
      id: 'youtube',
      liClassName: 'eupathdb-SmallMenuSocialMediaContainer',
      className: 'eupathdb-SocialMedia eupathdb-SocialMedia__youtube',
      url: youtubeUrl,
      title: 'Follow us on YouTube!',
      target: '_blank'
    } : [])
    ,"id")
}
