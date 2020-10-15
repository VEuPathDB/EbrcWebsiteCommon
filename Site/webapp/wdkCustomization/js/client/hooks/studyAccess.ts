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
  Props as UserTableConfig
} from 'ebrc-client/components/StudyAccess/UserTable';

import { ApiRequestHandler } from 'ebrc-client/util/api';

type StaffTableRow = ReturnType<typeof makeStaffTableRow>;
type ProviderTableRow = ReturnType<typeof makeProviderTableRow>;
type EndUserTableRow = ReturnType<typeof makeEndUserTableRow>;

type StaffTableConfig = UserTableConfig<StaffTableRow, 'userId' | 'lastName'>;
type ProviderTableConfig = UserTableConfig<ProviderTableRow, 'userId' | 'lastName'>;
type EndUserTableConfig = UserTableConfig<EndUserTableRow, 'userId' | 'lastName'>;

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
  const { value } = usePromise(
    async () => fetchStaffList(handler),
    []
  );

  const staffTableRows = useMemo(
    () => value?.data.map(makeStaffTableRow),
    [ value ]
  );

  return staffTableRows && {
    title: 'Staff',
    rows: staffTableRows
  };
}

export function useProviderTableConfig(handler: ApiRequestHandler, activeDatasetId: string): ProviderTableConfig | undefined {
  // FIXME: Fetch this data iff the user is a staff member or provider for the dataset
  const { value } = usePromise(
    async () => fetchProviderList(handler, activeDatasetId),
    []
  );

  const providerTableRows = useMemo(
    () => value?.data.map(makeProviderTableRow),
    [ activeDatasetId ]
  );

  return providerTableRows && {
    title: 'Providers',
    rows: providerTableRows
  };
}

export function useEndUserTableConfig(handler: ApiRequestHandler, activeDatasetId: string): EndUserTableConfig | undefined {
  // FIXME: Fetch this data iff the user is a staff member or provider for the dataset
  const { value } = usePromise(
    async () => fetchEndUserList(handler, activeDatasetId),
    []
  );

  const endUserTableRows = useMemo(
    () => value?.data.map(makeEndUserTableRow),
    [ activeDatasetId ]
  );

  return endUserTableRows && {
    title: 'End Users',
    rows: endUserTableRows
  };
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
