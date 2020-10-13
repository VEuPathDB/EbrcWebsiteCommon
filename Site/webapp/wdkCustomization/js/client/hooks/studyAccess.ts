import { useMemo } from 'react';

import { usePromise } from 'wdk-client/Hooks/PromiseHook';

import {
  createStudyAccessRequestHandler,
  fetchEndUserList,
  fetchProviderList,
  fetchStaffList
} from 'ebrc-client/StudyAccess/api';
import {
  DatasetProviderList,
  EndUserList,
  StaffList
} from 'ebrc-client/StudyAccess/Types';
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

export function useStaffTableConfig(handler: ApiRequestHandler) {
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
    rows: staffTableRows
  };
}

export function useProviderTableConfig(handler: ApiRequestHandler, activeDatasetId: string) {
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
    rows: providerTableRows
  };
}

export function useEndUserTableConfig(handler: ApiRequestHandler, activeDatasetId: string) {
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
