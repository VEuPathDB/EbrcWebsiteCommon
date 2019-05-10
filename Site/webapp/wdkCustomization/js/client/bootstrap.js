// Bootstrap the WDK client application
// ====================================

// placeholder used by webpack when making xhr's for code chunks
__webpack_public_path__ = window.__asset_path_remove_me_please__; // eslint-disable-line

// TODO Remove auth_tkt from url before proceeding

import * as siteConfig from './config';
import { rootUrl, rootElement, endpoint } from './config';
import pluginConfig from './pluginConfig';
import {
  initialize as initializeWdk,
  Components as WdkComponents,
  Controllers as WdkControllers
} from 'wdk-client';
import { debounce, identity, uniq, flow } from 'lodash';
import { loadSiteConfig } from './actioncreators/GlobalActionCreators';
import * as EbrcComponentWrappers from './component-wrappers';
import * as EbrcComponents from './components';
import * as EbrcControllers from './controllers';
import * as EbrcRoutes from './routes';
import ebrcWrapStoreModules from './wrapStoreModules';
import ebrcWrapWdkService from './wrapWdkService';

// include scroll to top button
import '../../../js/scroll-to-top';

/**
 * Initialize and run application
 *
 * @param {Object} [options]
 * @param {Object} [options.componentWrappers] An object whose keys are Wdk
 *    Component names, and whose values are higer-order Component functions.
 * @param {Function} [options.wrapRoutes] A function that takes a Routes object
 *    and returns a new Routes object. Use this as an opportunity alter routes.
 * @param {Function} [options.wrapWdkService] A function that takes WdkService and returns
 *     a sub class.
 * @param {ClientPlugin[]} [options.pluginConfig] TODO - docs
 * @param {ClassisHomePageConfig|CardBasedHomePageConfig} [options.homePageConfig] Options for home page
 */
export function initialize(options = {}) {
  const {
    componentWrappers,
    pluginConfig: sitePluginConfig = [],
    wrapRoutes = identity,
    wrapStoreModules = identity,
    wrapWdkService = identity,
    additionalMiddleware
  } = options;

  unaliasWebappUrl();
  removeJsessionid();

  wrapComponents(mergeWrapperObjects(componentWrappers, EbrcComponentWrappers));

  // initialize the application
  const context = initializeWdk({
    wrapRoutes: flow(EbrcRoutes.wrapRoutes, wrapRoutes),
    wrapStoreModules: flow(ebrcWrapStoreModules, wrapStoreModules),
    wrapWdkService: flow(ebrcWrapWdkService, wrapWdkService),
    rootUrl,
    rootElement,
    endpoint,
    onLocationChange: makeLocationHandler(),
    pluginConfig: sitePluginConfig.concat(pluginConfig),
    additionalMiddleware
  });

  (window.ebrc || (window.ebrc = {})).context = context

  context.store.dispatch(loadSiteConfig(siteConfig));

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
 * Merge site wrapper object and ebrc wrapper object, returning a new wrapper
 * object that will be passed to Wdk. ebrc wrappers are applied before site
 * wrappers.
 */
function mergeWrapperObjects(siteWrapperObject, ebrcWrapperObject) {
  const siteIsNull = siteWrapperObject == null;
  const ebrcIsNull = ebrcWrapperObject == null;

  if (siteIsNull && ebrcIsNull) return {};
  if (siteIsNull) return ebrcWrapperObject;
  if (ebrcIsNull) return siteWrapperObject;

  const siteKeys = Object.keys(siteWrapperObject);
  const ebrcKeys = Object.keys(ebrcWrapperObject);
  return uniq(siteKeys.concat(ebrcKeys))
    .reduce(function mergeWrappers(mergedWrappers, key) {
      return Object.assign(mergedWrappers, {
        [key]: composeWrappers(siteWrapperObject[key], ebrcWrapperObject[key])
      });
    }, {});
}

/**
 * Creates a wrapper function that composes a site wrapper and an ebrc wrapper.
 * The ebrc wrapper is applied before the site wrapper.
 */
function composeWrappers(siteWrapper = identity, ebrcWrapper = identity) {
  return function(wdkEntity) {
    return siteWrapper(ebrcWrapper(wdkEntity));
  }
}

/**
 * Apply component wrappers.
 */
function wrapComponents(wrappersByComponentName) {
  if (wrappersByComponentName == null) return;
  Object.entries(wrappersByComponentName).forEach(function([ componentName, componentWrapper ]) {
    const Component = (
      WdkComponents[componentName] ||
      WdkControllers[componentName] ||
      EbrcComponents[componentName] ||
      EbrcControllers[componentName]
    );

    if (Component == null) {
      console.warn('Skipping unknown component wrapper `%s`.', componentName);
    }

    else if (typeof Component.wrapComponent !== 'function') {
      console.warn('Warning: Component `%s` is not wrappable. Default version will be used.', componentName);
    }

    else {
      try {
        Component.wrapComponent(componentWrapper);
      }
      catch(error) {
        console.error('Could not apply component wrapper `%s`.', componentName, error);
      }
    }
  });
}
