import { useMemo } from 'react';

import { usePromise } from 'wdk-client/Hooks/PromiseHook';

import {
  DatasetProviderList,
  EndUserList,
  StaffList
} from 'ebrc-client/StudyAccess/Types';
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

export function useStudyAccessRequestHandler(
  baseStudyAccessUrl: string,
  fetchApi?: Window['fetch']
) {
  return useMemo(
    () => createStudyAccessRequestHandler(baseStudyAccessUrl, fetchApi),
    []
  );
}

type ElementType<T> = T extends (infer U)[] ? U : never;

type StaffTableRows = ReturnType<typeof makeStaffTableRows>;
type ProviderTableRows = ReturnType<typeof makeProviderTableRows>;
type EndUserTableRows = ReturnType<typeof makeEndUserTableRows>;

type StaffTableRow = ElementType<StaffTableRows>;
type ProviderTableRow = ElementType<ProviderTableRows>;
type EndUserTableRow = ElementType<EndUserTableRows>;

type StaffTableConfig = UserTableConfig<StaffTableRow, 'userId' | 'lastName'>;
type ProviderTableConfig = UserTableConfig<ProviderTableRow, 'userId' | 'lastName'>;
type EndUserTableConfig = UserTableConfig<EndUserTableRow, 'userId' | 'lastName'>;

export function useStaffTableConfig(handler: ApiRequestHandler): StaffTableConfig | undefined {
  // FIXME: Fetch this data iff the user is a staff member
  const { value } = usePromise(
    async () => fetchStaffList(handler),
    []
  );

  const staffTableRows = useMemo(
    () => value && makeStaffTableRows(value),
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
    async () => fetchProviderList(handler),
    []
  );

  const providerTableRows = useMemo(
    () => value && makeProviderTableRows(value, activeDatasetId),
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
    async () => fetchEndUserList(handler),
    []
  );

  const endUserTableRows = useMemo(
    () => value && makeEndUserTableRows(value, activeDatasetId),
    [ activeDatasetId ]
  );

  return endUserTableRows && {
    title: 'End Users',
    rows: endUserTableRows
  };
}

function makeStaffTableRows(response: StaffList) {
  return response.data.map(
    ({ user, ...rest }) => ({
      ...user,
      ...rest
    })
  );
}

function makeProviderTableRows(response: DatasetProviderList, activeDatasetId: string) {
  const filteredResponseData = response.data.filter(
    ({ datasetId }) => datasetId === activeDatasetId
  );

  return filteredResponseData.map(
    ({ user, ...rest }) => ({
      ...user,
      ...rest
    })
  );
}

function makeEndUserTableRows(response: EndUserList, activeDatasetId: string) {
  const filteredResponseData = response.data.filter(
    ({ datasetId }) => datasetId === activeDatasetId
  );

  return filteredResponseData.map(
    ({ user, ...rest }) => ({
      ...user,
      ...rest
    })
  );
}
