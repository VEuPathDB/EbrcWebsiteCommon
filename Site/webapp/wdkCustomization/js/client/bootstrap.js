// Bootstrap the WDK client application
// ====================================

// placeholder used by webpack when making xhr's for code chunks
__webpack_public_path__ = window.__asset_path_remove_me_please__; // eslint-disable-line

// TODO Remove auth_tkt from url before proceeding

import * as siteConfig from './config';
import { rootUrl, rootElement, endpoint } from './config';
import { initialize as initializeWdk, wrapComponents } from 'wdk-client';
import { debounce, mergeWith, identity, flow } from 'lodash';
import { loadBasketCounts, loadQuickSearches } from './actioncreators/GlobalActionCreators';
import makeHeaderWrapper from './component-wrappers/Header';
import makeDownloadFormWrapper from './component-wrappers/DownloadForm';
import Footer from './component-wrappers/Footer';
import eupathStoreWrappers from './store-wrappers';
import { selectReporterComponent } from './util/reporter';

// include scroll to top button
import '../../../js/scroll-to-top';

/**
 * Initialize and run application
 *
 * @param {Object} options
 * @param {Object} options.componentWrappers
 * @param {Object} options.storeWrappers
 * @param {Array} options.quickSearches
 * @param {Function} options.wrapRoutes
 * @param {boolean} options.isPartOfEuPathDB
 * @param {boolean} options.flattenSearches
 * @param {boolean} options.includeQueryGrid
 * @param {Array} options.additionalMenuEntries
 */
export function initialize(options = {}) {
  const Header = makeHeaderWrapper({
    siteConfig,
    isPartOfEuPathDB: options.isPartOfEuPathDB,
    flattenSearches: options.flattenSearches,
    includeQueryGrid: options.includeQueryGrid,
    // TODO Rename this to `mainMenuEntries`
    additionalMenuEntries: options.additionalMenuEntries,
    smallMenuEntries: options.smallMenuEntries
  });
  const DownloadForm = makeDownloadFormWrapper(selectReporterComponent);
  const eupathComponentWrappers = {
    Header,
    DownloadForm,
    Footer
  };
  const {
    quickSearches,
    componentWrappers,
    storeWrappers,
    wrapRoutes
  } = options;

  unaliasWebappUrl();
  removeJsessionid();

  wrapComponents(composeFunctionObjects(eupathComponentWrappers, componentWrappers));

  // initialize the application
  const context = initializeWdk({
    wrapRoutes,
    storeWrappers: composeFunctionObjects(eupathStoreWrappers, storeWrappers),
    rootUrl,
    rootElement,
    endpoint,
    onLocationChange: makeLocationHandler()
  });

  // XXX Move calls to dispatchAction to controller override?

  // load quick search data
  if (quickSearches) {
    context.dispatchAction(loadQuickSearches(quickSearches));
  }

  context.dispatchAction(loadBasketCounts());

  return context;
}

/**
 * Replace apache alaias `/a` with the webapp url.
 */
function unaliasWebappUrl() {
  if (rootUrl) {
    // replace '/a/' with '/${webapp}/'
    let pathname = window.location.pathname;
    let aliasUrl = rootUrl.replace(/^\/[^/]+\/(.*)$/, '/a/$1');
    if (pathname.startsWith(aliasUrl)) {
      window.history.replaceState(null, '', pathname.replace(aliasUrl, rootUrl));
    }
  }

}

/**
 * Remove ;jsessionid=... from url, since it breaks some pages.
 */
function removeJsessionid() {
  // remove jsessionid from url
  window.history.replaceState(null, '',
    window.location.pathname.replace(/;jsessionid=\w{32}/i, '') +
    window.location.search + window.location.hash);
}

/** Create location handler */
function makeLocationHandler() {
  // save previousLocation so we can conditionally send pageview events
  let previousLocation;

  /** Send pageview events to Google Analytics */
  return debounce(function onLocationChange(location) {
    // skip if google analytics object is not defined
    if (!window.ga) return;

    // skip if the previous pathname and new pathname are the same, since
    // hash changes are currently detected.
    if (previousLocation && previousLocation.pathname === location.pathname) return;

    // update previousLocation
    previousLocation = location;

    window.ga('send', 'pageview', {
      page: location.pathname,
      title: location.pathname
    });
  }, 1000);
}

/**
 * Merges two function dictionary objects such that properties of duplicate keys
 * are composed.
 */
function composeFunctionObjects(...functionObjects) {
  return mergeWith({}, ...functionObjects, (a = identity, b = identity) => flow(a, b));
}
