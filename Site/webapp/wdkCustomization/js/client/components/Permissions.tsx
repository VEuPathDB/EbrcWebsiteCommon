import React from 'react';

import { usePromise } from 'wdk-client/Hooks/PromiseHook';
import { useWdkService } from 'wdk-client/Hooks/WdkServiceHook';

import { UserPermissions, checkPermissions } from 'ebrc-client/StudyAccess/permission';

export function withPermissions<P>(Component: React.ComponentType<P & { permissions: UserPermissions }>): React.ComponentType<P> {
  return function(props) {
    const user = useWdkService(
      wdkService => wdkService.getCurrentUser(),
      []
    );

    const { value: permissions } = usePromise(
      async () => user && checkPermissions(user),
      [ user ]
    );

    return permissions == null
      ? null
      : <Component {...props} permissions={permissions} />;
  }
}
