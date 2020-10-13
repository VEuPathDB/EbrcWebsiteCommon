import { useMemo } from 'react';

import { createStudyAccessRequestHandler } from 'ebrc-client/StudyAccess/api';
import {
  DatasetProviderList,
  EndUserList,
  StaffList
} from 'ebrc-client/StudyAccess/Types';

export function useStudyAccessRequestHandler(
  baseStudyAccessUrl: string,
  fetchApi?: Window['fetch']
) {
  return useMemo(
    () => createStudyAccessRequestHandler(baseStudyAccessUrl, fetchApi),
    []
  );
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
