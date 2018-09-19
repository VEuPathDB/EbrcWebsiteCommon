import TreeDataViewerController from './controllers/TreeDataViewerController';
import ContactUsController from './controllers/ContactUsController';

/**
 * Wrap WDK Routes
 */
export const wrapRoutes = wdkRoutes => [
  { path: '/tree-data-viewer', component: TreeDataViewerController },
  { path: '/contact-us', component: ContactUsController },
  ...wdkRoutes
];
