import { zipWith } from 'lodash';

import {
  ApiRequestHandler,
  createFetchApiRequestHandler,
  createJsonRequest,
  standardTransformer
} from 'ebrc-client/util/api';
import {
  DatasetProviderCreateRequest,
  DatasetProviderCreateResponse,
  DatasetProviderList,
  DatasetProviderPatch,
  NewStaffRequest,
  NewStaffResponse,
  StaffList,
  StaffPatch,
  datasetProviderList,
  datasetProviderCreateResponse,
  newStaffResponse,
  staffList
} from 'ebrc-client/StudyAccess/Types';

const STAFF_PATH = '/staff';
const PROVIDERS_PATH = '/dataset-providers';
const END_USERS_PATH = '/dataset-end-users';

export function createStudyAccessRequestHandler(
  baseStudyAccessUrl: string,
  fetchApi?: Window['fetch']
) {
  // FIXME: DRY this up
  const wdkCheckAuth = document.cookie.split('; ').find(x => x.startsWith('wdk_check_auth=')) ?? '';
  const authKey = wdkCheckAuth.replace('wdk_check_auth=', '');

  return createFetchApiRequestHandler({
    baseUrl: baseStudyAccessUrl,
    init: {
      headers: {
        'Auth-Key': authKey
      }
    },
    fetchApi
  });
}

export function fetchStaffList(
  handler: ApiRequestHandler,
  limit?: number,
  offset?: number
): Promise<StaffList> {
  const queryString = makeQueryString(
    ['limit', 'offset'],
    [limit, offset]
  );

  return handler({
    path: `${STAFF_PATH}${queryString}`,
    method: 'GET',
    transformResponse: standardTransformer(staffList)
  });
}

export function newStaffEntry(
  handler: ApiRequestHandler,
  requestBody: NewStaffRequest
): Promise<NewStaffResponse> {
  const request = createJsonRequest({
    path: STAFF_PATH,
    method: 'POST',
    body: requestBody,
    transformResponse: standardTransformer(newStaffResponse)
  });

  return handler(request);
}

export function updateStaffEntry(
  handler: ApiRequestHandler,
  staffId: number,
  requestBody: StaffPatch
) {
  const request = createJsonRequest({
    path: `${STAFF_PATH}/${staffId}`,
    method: 'PATCH',
    body: requestBody,
    transformResponse: noContent
  });

  return handler(request);
}

export function deleteStaffEntry(
  handler: ApiRequestHandler,
  staffId: number
) {
  return handler({
    path: `${STAFF_PATH}/${staffId}`,
    method: 'DELETE',
    transformResponse: noContent
  });
}

export function fetchProviderList(
  handler: ApiRequestHandler,
  limit?: number,
  offset?: number
): Promise<DatasetProviderList> {
  const queryString = makeQueryString(
    ['limit', 'offset'],
    [limit, offset]
  );

  return handler({
    path: `${PROVIDERS_PATH}${queryString}`,
    method: 'GET',
    transformResponse: standardTransformer(datasetProviderList)
  });
}

export function newProviderEntry(
  handler: ApiRequestHandler,
  requestBody: DatasetProviderCreateRequest
): Promise<DatasetProviderCreateResponse> {
  const request = createJsonRequest({
    path: PROVIDERS_PATH,
    method: 'POST',
    body: requestBody,
    transformResponse: standardTransformer(datasetProviderCreateResponse)
  });

  return handler(request);
}

export function updateProviderEntry(
  handler: ApiRequestHandler,
  providerId: number,
  requestBody: DatasetProviderPatch
) {
  const request = createJsonRequest({
    path: `${PROVIDERS_PATH}/${providerId}`,
    method: 'PATCH',
    body: requestBody,
    transformResponse: noContent
  });

  return handler(request);
}

export function deleteProviderEntry(
  handler: ApiRequestHandler,
  providerId: number
) {
  return handler({
    path: `${PROVIDERS_PATH}/${providerId}`,
    method: 'DELETE',
    transformResponse: noContent
  });
}

async function noContent(body: unknown) {
  return null;
}

function makeQueryString(
  paramNames: string[],
  paramValues: (string | number | boolean | null | undefined)[]
) {
  const queryParams = zipWith(
    paramNames,
    paramValues,
    (name, value) => value == null
      ? undefined
      : `${name}=${encodeURIComponent(value)}`
  );

  const nonNullParams = queryParams.filter(
    (param): param is string => param != null
  );

  return nonNullParams.length === 0
    ? ''
    : `?${nonNullParams.join('&')}`;
}
