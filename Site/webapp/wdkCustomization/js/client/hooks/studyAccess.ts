import { useMemo } from 'react';

import { usePromise } from 'wdk-client/Hooks/PromiseHook';

import { UserDetails } from 'ebrc-client/StudyAccess/Types';
import {
  createStudyAccessRequestHandler,
  fetchEndUserList,
  fetchProviderList,
  fetchStaffList
} from 'ebrc-client/StudyAccess/api';
import {
  UserTableColumnKey,
  Props as UserTableProps
} from 'ebrc-client/components/StudyAccess/UserTable';

import { ApiRequestHandler } from 'ebrc-client/util/api';

type StaffTableRow = ReturnType<typeof makeStaffTableRow>;
type ProviderTableRow = ReturnType<typeof makeProviderTableRow>;
type EndUserTableRow = ReturnType<typeof makeEndUserTableRow>;

type TableConfig<R, C extends UserTableColumnKey<R>> =
  | {
      status: 'loading';
    }
  | {
      status: 'error';
      message: string;
    }
  | {
      status: 'unavailable';
    }
  | {
      status: 'success';
      value: UserTableProps<R, C>;
    };

type StaffTableConfig = TableConfig<StaffTableRow, 'userId'>;
type ProviderTableConfig = TableConfig<ProviderTableRow, 'userId'>;
type EndUserTableConfig = TableConfig<EndUserTableRow, 'userId'>;

export function useStudyAccessRequestHandler(
  baseStudyAccessUrl: string,
  fetchApi?: Window['fetch']
) {
  return useMemo(
    () => createStudyAccessRequestHandler(baseStudyAccessUrl, fetchApi),
    []
  );
}

export function useStaffTableConfig(handler: ApiRequestHandler): StaffTableConfig | undefined {
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
          value: {
            title: 'Staff',
            rows: value.data.map(makeStaffTableRow)
          }
        },
    [ value, loading ]
  );
}

export function useProviderTableConfig(handler: ApiRequestHandler, activeDatasetId: string): ProviderTableConfig | undefined {
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
          value: {
            title: 'Providers',
            rows: value.data.map(makeProviderTableRow)
          }
        },
    [ value, loading ]
  );
}

export function useEndUserTableConfig(handler: ApiRequestHandler, activeDatasetId: string): EndUserTableConfig | undefined {
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
          value: {
            title: 'End Users',
            rows: value.data.map(makeEndUserTableRow)
          }
        },
    [ value, loading ]
  );
}

const makeStaffTableRow = flattenDataRow;
const makeProviderTableRow = flattenDataRow;
const makeEndUserTableRow = flattenDataRow;

function flattenDataRow<R extends { user: UserDetails }>(dataRow: R) {
  const { user, ...rest } = dataRow;

  return ({
    ...user,
    ...rest
  });
}
