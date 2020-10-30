import { capitalize } from 'lodash';

import {
  ApprovalStatus,
  DatasetPermissionEntry,
  PermissionsResponse
} from 'ebrc-client/StudyAccess/EntityTypes';

export type UserPermissions =
  | StaffPermissions
  | ExternalUserPermissions
  | NoPermissions;

export interface StaffPermissions {
  type: 'staff';
  isOwner: boolean;
}
export interface ExternalUserPermissions {
  type: 'external';
  perDataset: Record<string, DatasetPermissionEntry | undefined>;
}
export interface NoPermissions {
  type: 'none';
}

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

export function isOwner(userPermissions: UserPermissions) {
  return userPermissions.type === 'staff' && userPermissions.isOwner;
}

export function isStaff(userPermissions: UserPermissions) {
  return userPermissions.type === 'staff';
}

export function isManager(userPermissions: UserPermissions, datasetId: string) {
  if (userPermissions.type !== 'external') {
    return false;
  }

  const datasetPermissions = userPermissions.perDataset[datasetId];

  return (
    datasetPermissions?.type === 'provider' &&
    datasetPermissions.isManager
  );
}

export function isProvider(userPermissions: UserPermissions, datasetId: string) {
  return (
    userPermissions.type === 'external' &&
    userPermissions.perDataset[datasetId]?.type === 'provider'
  );
}

export function isEndUser(userPermissions: UserPermissions, datasetId: string) {
  return (
    userPermissions.type === 'external' &&
    userPermissions.perDataset[datasetId]?.type === 'enduser'
  );
}

export function canAccessDashboard(userPermissions: UserPermissions, datasetId: string) {
  return (
    isStaff(userPermissions) ||
    isProvider(userPermissions, datasetId)
  );
}

export function shouldDisplayStaffTable(userPermissions: UserPermissions) {
  return isStaff(userPermissions);
}

// By "updating staff", we mean:
// (1) adding a new staff member
// (2) removing an existing staff member
// (3) altering a staff member's "owner"ship
export function canUpdateStaff(userPermissions: UserPermissions) {
  return isOwner(userPermissions);
}

export function shouldDisplayProvidersTable(userPermissions: UserPermissions, datasetId: string) {
  return (
    isStaff(userPermissions) ||
    isProvider(userPermissions, datasetId)
  );
}

// By "updating the providers", we mean:
// (1) adding a new provider
// (2) removing an existing provider
// (3) altering a provider's managerial capabilities
export function canUpdateProviders(userPermissions: UserPermissions, datasetId: string) {
  return (
    isStaff(userPermissions) ||
    isManager(userPermissions, datasetId)
  );
}

export function shouldDisplayEndUsersTable(userPermissions: UserPermissions, datasetId: string) {
  return canAccessDashboard(userPermissions, datasetId);
}

export function canAddEndUsers(userPermissions: UserPermissions, datasetId: string) {
  return canAccessDashboard(userPermissions, datasetId);
}

export function canRemoveEndUsers(userPermissions: UserPermissions) {
  return isStaff(userPermissions);
}

export function canUpdateApprovalStatus(userPermissions: UserPermissions, datasetId: string) {
  return (
    isStaff(userPermissions) ||
    isProvider(userPermissions, datasetId)
  );
}

export function permittedApprovalStatusChanges(oldApprovalStatus: ApprovalStatus): ApprovalStatus[] {
  return oldApprovalStatus === 'requested'
    ? [ 'requested', 'approved', 'denied']
    : oldApprovalStatus === 'approved'
    ? [ 'approved', 'denied' ]
    : [ 'requested', 'approved', 'denied'];
}
