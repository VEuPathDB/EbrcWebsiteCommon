import TreeDataViewerController from './controllers/TreeDataViewerController';
import ContactUsController from './controllers/ContactUsController';

/**
 * Wrap WDK Routes
 * Jan 9 2019: routes here connect to a react component that is mostly shared across websites.
 * For example: the route '/about' is not here because the content (in About.jsx) is not shared.
 */
export const wrapRoutes = wdkRoutes => [
  { path: '/tree-data-viewer', component: TreeDataViewerController },
  { path: '/contact-us', component: ContactUsController },
  ...wdkRoutes
];
