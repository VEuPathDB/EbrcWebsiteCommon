import { capitalize } from 'lodash';

import {
  ApprovalStatus,
  DatasetPermissionEntry,
  PermissionsResponse
} from 'ebrc-client/StudyAccess/EntityTypes';

export type UserPermissions =
  | { type: 'staff', isOwner: boolean }
  | { type: 'external', perDataset: Record<string, DatasetPermissionEntry> }
  | { type: 'none' };

export function permissionsResponseToUserPermissions(permissionsResponse: PermissionsResponse): UserPermissions {
  if (
    permissionsResponse.isStaff === true ||
    permissionsResponse.isOwner === true
  ) {
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

export function permittedApprovalStatusChanges(oldApprovalStatus: ApprovalStatus): ApprovalStatus[] {
  return oldApprovalStatus === 'requested'
    ? [ 'requested', 'approved', 'denied']
    : oldApprovalStatus === 'approved'
    ? [ 'approved', 'denied' ]
    : [ 'requested', 'approved', 'denied'];
}

export function makeApprovalStatusSelectItems(oldApprovalStatus: ApprovalStatus) {
  return permittedApprovalStatusChanges(oldApprovalStatus).map(permittedStatus => ({
    value: permittedStatus,
    display: capitalize(permittedStatus)
  }));
}
