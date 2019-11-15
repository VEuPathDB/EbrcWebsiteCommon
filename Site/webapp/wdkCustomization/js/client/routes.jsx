import React from 'react';
import { communitySite } from 'ebrc-client/config';

import TreeDataViewerController from './controllers/TreeDataViewerController';
import ContactUsController from './controllers/ContactUsController';
import GalaxyTermsController from './controllers/GalaxyTermsController';
import ExternalContentController from 'ebrc-client/controllers/ExternalContentController';
/**
 * Wrap WDK Routes
 * Jan 9 2019: routes here connect to a react component that is mostly shared across websites.
 * For example: the route '/about' is not here because the content (in About.jsx) is not shared.
 */
export const wrapRoutes = wdkRoutes => [
  {
    path: '/tree-data-view',
    component: () => <TreeDataViewerController/>
  },

  {
    path: '/galaxy-orientation',
    component: () => <GalaxyTermsController/>
  },

  {
    path: '/galaxy-orientation/sign-up',
    component: () => <GalaxyTermsController signUp />
  },

  {
    path: '/contact-us',
    component: () => <ContactUsController/>
  },

  {
    path: '/community/:path*',
    component: props =>
      <ExternalContentController
        url={communitySite + props.match.params.path + props.location.search + props.location.hash}
      />
  },

  ...wdkRoutes
];
