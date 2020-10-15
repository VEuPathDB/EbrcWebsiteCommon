import { useMemo } from 'react';

import { usePromise } from 'wdk-client/Hooks/PromiseHook';

import {
  DatasetProvider,
  EndUser,
  Staff,
  UserDetails
} from 'ebrc-client/StudyAccess/Types';
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

type BaseTableRow<R extends { user: UserDetails }> = Omit<R, 'user'> & UserDetails;

export type StaffTableRow = BaseTableRow<Staff>;
export type ProviderTableRow = BaseTableRow<DatasetProvider>;
export type EndUserTableRow = BaseTableRow<EndUser>;

export type StaffTableSectionConfig = UserTableSectionConfig<StaffTableRow, 'userId'>;
export type ProviderTableSectionConfig = UserTableSectionConfig<ProviderTableRow, 'userId'>;
export type EndUserTableSectionConfig = UserTableSectionConfig<EndUserTableRow, 'userId'>;

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
            rows: value.data.map(({ user, ...rest }) => ({ ...user, ...rest }))
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
            rows: value.data.map(({ user, ...rest }) => ({ ...user, ...rest }))
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
            rows: value.data.map(({ user, ...rest }) => ({ ...user, ...rest }))
          }
        },
    [ value, loading ]
  );
}
