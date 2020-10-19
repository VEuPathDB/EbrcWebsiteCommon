import { useMemo } from 'react';

import { usePromise } from 'wdk-client/Hooks/PromiseHook';

import {
  createStudyAccessRequestHandler,
  fetchEndUserList,
  fetchProviderList,
  fetchStaffList
} from 'ebrc-client/StudyAccess/api';
import {
  Props as UserTableSectionConfig
} from 'ebrc-client/components/StudyAccess/UserTableSection';

import { ApiRequestHandler } from 'ebrc-client/util/api';

interface BaseTableRow {
  userId: number;
  name: string;
}

export interface StaffTableRow extends BaseTableRow {
  isOwner: boolean;
  // email: string;
}

export interface ProviderTableRow extends BaseTableRow {
  isManager: boolean;
  // email: string;
}


export interface EndUserTableRow extends BaseTableRow {

}

export type StaffTableSectionConfig = UserTableSectionConfig<StaffTableRow, keyof StaffTableRow>;
export type ProviderTableSectionConfig = UserTableSectionConfig<ProviderTableRow, keyof ProviderTableRow>;
export type EndUserTableSectionConfig = UserTableSectionConfig<EndUserTableRow, keyof EndUserTableRow>;

export function useStudyAccessRequestHandler(
  baseStudyAccessUrl: string,
  fetchApi?: Window['fetch']
) {
  return useMemo(
    () => createStudyAccessRequestHandler(baseStudyAccessUrl, fetchApi),
    []
  );
}

export function useStaffTableSectionConfig(handler: ApiRequestHandler): StaffTableSectionConfig {
  // FIXME: Fetch this data iff the user is a staff member
  const { value, loading } = usePromise(
    async () => {
      try {
        return await fetchStaffList(handler);
      } catch (e) {
        return 'error';
      }
    },
    []
  );

  return useMemo(
    () => loading
      ? {
          status: 'loading'
        }
      : value == null || value == 'error'
      ? {
          status: 'unavailable'
        }
      : {
          status: 'success',
          title: 'Staff',
          value: {
            rows: value.data.map(({ user, isOwner }) => ({
              userId: user.userId,
              name: `${user.firstName} ${user.lastName}`,
              isOwner
            })),
            columns: {
              userId: {
                key: 'userId',
                name: 'User ID',
                sortable: true
              },
              name: {
                key: 'name',
                name: 'Name',
                sortable: true
              },
              isOwner: {
                key: 'isOwner',
                name: 'Is Owner?',
                sortable: true,
                makeSearchableString: booleanToString,
                makeOrder: ({ isOwner }) => booleanToString(isOwner),
                renderCell: ({ value }) => booleanToString(value)
              }
            },
            columnOrder: [ 'userId', 'name', 'isOwner' ]
          }
        },
    [ value, loading ]
  );
}

export function useProviderTableSectionConfig(handler: ApiRequestHandler, activeDatasetId: string): ProviderTableSectionConfig {
  // FIXME: Fetch this data iff the user is a staff member or provider for the dataset
  const { value, loading } = usePromise(
    async () => {
      try {
        return await fetchProviderList(handler, activeDatasetId);
      } catch (e) {
        return 'error';
      }
    },
    [ activeDatasetId ]
  );

  return useMemo(
    () => loading
      ? {
          status: 'loading'
        }
      : value == null || value == 'error'
      ? {
          status: 'unavailable'
        }
      : {
          status: 'success',
          title: 'Providers',
          value: {
            rows: value.data.map(({ user, isManager }) => ({
              userId: user.userId,
              name: `${user.firstName} ${user.lastName}`,
              isManager
            })),
            columns: {
              userId: {
                key: 'userId',
                name: 'User ID',
                sortable: true
              },
              name: {
                key: 'name',
                name: 'Name',
                sortable: true
              },
              isManager: {
                key: 'isManager',
                name: 'Is Manager?',
                sortable: true,
                makeSearchableString: booleanToString,
                makeOrder: ({ isManager }) => booleanToString(isManager),
                renderCell: ({ value }) => booleanToString(value)
              }
            },
            columnOrder: [ 'userId', 'name', 'isManager' ]
          }
        },
    [ value, loading ]
  );
}

export function useEndUserTableSectionConfig(handler: ApiRequestHandler, activeDatasetId: string): EndUserTableSectionConfig {
  // FIXME: Fetch this data iff the user is a staff member or provider for the dataset
  const { value, loading } = usePromise(
    async () => {
      try {
        return await fetchEndUserList(handler, activeDatasetId);
      } catch (e) {
        return 'error';
      }
    },
    [ activeDatasetId ]
  );

  return useMemo(
    () => loading
      ? {
          status: 'loading'
        }
      : value == null || value == 'error'
      ? {
          status: 'unavailable'
        }
      : {
          status: 'success',
          title: 'End Users',
          value: {
            rows: value.data.map(({ user }) => ({
              userId: user.userId,
              name: `${user.firstName} ${user.lastName}`
            })),
            columns: {
              userId: {
                key: 'userId',
                name: 'User ID',
                sortable: true
              },
              name: {
                key: 'name',
                name: 'Name',
                sortable: true
              },
            },
            columnOrder: [ 'userId' ]
          }
        },
    [ value, loading ]
  );
}

function booleanToString(value: boolean) {
  return value === true ? 'Yes' : 'No';
}
