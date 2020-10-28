import {
  DatasetPermissionEntry,
  PermissionsResponse
} from 'ebrc-client/StudyAccess/EntityTypes';

export type UserPermissions =
  | { type: 'staff', isOwner: boolean }
  | { type: 'external', perDataset: Record<string, DatasetPermissionEntry> }
  | { type: 'none' };

export function permissionsResponseToUserPermissions(permissionsResponse: PermissionsResponse): UserPermissions {
  if (permissionsResponse.isStaff != null) {
    return {
      type: 'staff',
      isOwner: !!permissionsResponse.isOwner
    };
  } else if (permissionsResponse.perDataset != null) {
    return {
      type: 'external',
      perDataset: permissionsResponse.perDataset
    };
  } else {
    return {
      type: 'none'
    };
  }
}
