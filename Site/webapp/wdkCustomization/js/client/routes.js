import TreeDataViewerController from './controllers/TreeDataViewerController';

/**
 * Wrap WDK Routes
 */
export const wrapRoutes = wdkRoutes => [
  { path: '/tree-data-viewer', component: TreeDataViewerController },
  ...wdkRoutes
]