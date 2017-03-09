import { add, reduce } from 'lodash';
import { PropTypes } from 'react';
import { getId, getDisplayName, getTargetType, isIndividual } from 'wdk-client/CategoryUtils';
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
    basketCounts,
    ontology,
    quickSearches,
    recordClasses,
    user,
    showLoginForm,
    showLoginWarning,
    showLogoutWarning,
    location,

    siteConfig,
    includeQueryGrid,
    isPartOfEuPathDB,
    flattenSearches,
    additionalMenuEntries,
    smallMenuEntries
  } = props;

  const {
    announcements,
    buildNumber,
    facebookId,
    twitterId,
    youtubeId,
    projectId,
    releaseDate,
    webAppUrl
  } = siteConfig;

  const totalBasketCount = reduce(basketCounts, add, 0);

  const isLoggedIn = user && !user.isGuest;

  return (
    <div>
      <div id="header">
        <div id="header2">
          <div id="header_rt">
            <div id="toplink">
              {isPartOfEuPathDB &&
                <a href="http://eupathdb.org">
                  <img alt="Link to EuPathDB homepage" src={webAppUrl + '/images/' + projectId + '/partofeupath.png'}/>
                </a>
              }
            </div>
            <QuickSearch webAppUrl={webAppUrl} questions={quickSearches}/>
            <SmallMenu
              webAppUrl={webAppUrl}
              entries={smallMenuEntries(siteConfig).concat([
                isLoggedIn ? {
                  text: `${user.firstName} ${user.lastName}'s Profile`,
                  route: 'user/profile'
                } : {
                  text: 'Login',
                  url: '#login',
                  onClick: e => { e.preventDefault(); showLoginForm(); }
                },

                isLoggedIn ? {
                  text: 'Logout',
                  url: '#logout',
                  onClick: e => { e.preventDefault(); showLogoutWarning(); }
                } : {
                  text: 'Register',
                  webAppUrl: '/showRegister.do'
                },
                {
                  text: 'Contact Us',
                  webAppUrl: '/contact.do',
                  target: '_blank'
                }
              ])
                  .concat(twitterId ? {
                    liClassName: 'eupathdb-SmallMenuSocialMediaContainer',
                    className: 'eupathdb-SocialMedia eupathdb-SocialMedia__twitter',
                    url: `https://twitter.com/${twitterId}`,
                    title: 'Follow us on Twitter!',
                    target: '_blank'
                  } : [])
                  .concat(facebookId ? {
                    liClassName: 'eupathdb-SmallMenuSocialMediaContainer',
                    className: 'eupathdb-SocialMedia eupathdb-SocialMedia__facebook',
                    url: `https://facebook.com/${facebookId}`,
                    title: 'Follow us on Facebook!',
                    target: '_blank'
                  } : [])
                  .concat(youtubeId ? {
                    liClassName: 'eupathdb-SmallMenuSocialMediaContainer',
                    className: 'eupathdb-SocialMedia eupathdb-SocialMedia__youtube',
                    url: `http://www.youtube.com/user/${youtubeId}/videos?sort=dd&flow=list&view=1`,
                    title: 'Follow us on YouTube!',
                    target: '_blank'
                  } : [])
              }
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
        {/* TODO Put entries into an external JSON file. */}
        <Menu
          webAppUrl={webAppUrl}
          projectId={projectId}
          showLoginWarning={showLoginWarning}
          isGuest={user ? user.isGuest : true}
          entries={[
          { id: 'home', text: 'Home', tooltip: 'Go to the home page', url: webAppUrl },
          { id: 'search', text: 'New Search', tooltip: 'Start a new search strategy',
            children: getSearchEntries(ontology, recordClasses, flattenSearches).concat(
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
          }]
          .concat(additionalMenuEntries(siteConfig))
          .concat([{
            id: 'favorites',
            text: (
              <div>
                <span className="fa-stack fa-pull-left"
                  style={{
                    position: 'relative',
                    top: '-16px',
                    fontSize: '1.8em',
                    marginRight: '-6px',
                    marginLeft: '-18px'
                  }}>
                  <i className="fa fa-star fa-stack-1x" style={{color: 'yellow'}}/>
                  <i className="fa fa-star-o fa-stack-1x" style={{color: '#eb971f'}}/>
                </span>
                {' My Favorites'}
              </div>
            ),
            webAppUrl: '/showFavorite.do',
            loginRequired: true
          }])}/>
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
  quickSearches: PropTypes.array,
  preferences: PropTypes.object,
  location: PropTypes.object,
  showLoginForm: PropTypes.func.isRequired,
  showLoginWarning: PropTypes.func.isRequired,
  showLogoutWarning: PropTypes.func.isRequired,
  siteConfig: PropTypes.object.isRequired,
  includeQueryGrid: PropTypes.bool,
  isPartOfEuPathDB: PropTypes.bool,
  flattenSearches: PropTypes.bool,
  additionalMenuEntries: PropTypes.func,
  smallMenuEntries: PropTypes.func
};

Header.defaultProps = {
  includeQueryGrid: true,
  isPartOfEuPathDB: true,
  flattenSearches: false,
  additionalMenuEntries: () => [],
  smallMenuEntries: () => []
};

export default wrappable(Header);


// helpers

/**
 * Map search tree to menu entries. If flatten is true, return a flat
 * list of search entries. Otherwise, return the full tree of search
 * entries.
 */
function getSearchEntries(ontology, recordClasses, flatten = false) {
  if (ontology == null || recordClasses == null) return [];
  let tree = getSearchMenuCategoryTree(ontology, recordClasses, {});
  return flatten ? preorderSeq(tree).filter(isIndividual).map(createMenuEntry)
                 : tree.children.map(createMenuEntry);
}

/** Map a search node to a meny entry */
function createMenuEntry(searchNode) {
  return {
    id: getId(searchNode),
    text: getDisplayName(searchNode),
    children: searchNode.children.map(createMenuEntry),
    webAppUrl: getTargetType(searchNode) === 'search' &&
      '/showQuestion.do?questionFullName=' + getId(searchNode)
  };
}
