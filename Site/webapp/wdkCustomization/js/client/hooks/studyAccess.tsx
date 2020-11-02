import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  capitalize,
  partition,
  zipWith
 } from 'lodash';

import { IconAlt, SingleSelect } from 'wdk-client/Components';
import { usePromise } from 'wdk-client/Hooks/PromiseHook';
import { useWdkService } from 'wdk-client/Hooks/WdkServiceHook';
import { OverflowingTextCell } from 'wdk-client/Views/Strategy/OverflowingTextCell';

import { fetchStudies } from 'ebrc-client/App/Studies/StudyActionCreators';
import { ApprovalStatus } from 'ebrc-client/StudyAccess/EntityTypes';
import {
  StudyAccessApi,
  apiRequests,
  createStudyAccessRequestHandler
} from 'ebrc-client/StudyAccess/api';
import {
  UserPermissions,
  canUpdateApprovalStatus,
  canUpdateProviders,
  permissionsResponseToUserPermissions,
  permittedApprovalStatusChanges,
  shouldDisplayEndUsersTable,
  shouldDisplayProvidersTable,
  shouldDisplayStaffTable
} from 'ebrc-client/StudyAccess/permission';
import {
  Props as UserTableDialogProps,
  AccessDenialContent,
  AddProvidersContent,
  ContentProps,
  UsersAddedContent
} from 'ebrc-client/components/StudyAccess/UserTableDialog';
import {
  Props as UserTableSectionConfig
} from 'ebrc-client/components/StudyAccess/UserTableSection';
import { bindApiRequestCreators } from 'ebrc-client/util/api';

interface BaseTableRow {
  userId: number;
  name: string;
  email: string;
}

interface StaffTableRow extends BaseTableRow {
  isOwner: boolean;
}

interface ProviderTableRow extends BaseTableRow {
  isManager: boolean;
}

interface ProviderTableFullRow extends ProviderTableRow {
  providerId: number;
}

interface EndUserTableRow extends BaseTableRow {
  startDate?: string;
  content: string;
  approvalStatus: ApprovalStatus;
  denialReason: string;
}

interface EndUserTableFullRow extends EndUserTableRow {
  purpose: string;
  researchQuestion: string;
  analysisPlan: string;
  disseminationPlan: string;
}

export type StaffTableSectionConfig = UserTableSectionConfig<StaffTableRow, keyof StaffTableRow>;
export type ProviderTableSectionConfig = UserTableSectionConfig<ProviderTableFullRow, keyof ProviderTableRow>;
export type EndUserTableSectionConfig = UserTableSectionConfig<EndUserTableFullRow, keyof EndUserTableRow>;

export type OpenDialogConfig = UserTableDialogProps;

interface EndUserTableUiState {
  approvalStatus: Record<number, ApprovalStatus | undefined>;
  denialReason: Record<number, string | undefined>;
}

type StudyStatus =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'success', record: any };

export function useStudy(datasetId: string): StudyStatus {
  const studies = useWdkService(fetchStudies, []);

  return useMemo(
    () => {
      if (studies == null) {
        return { status: 'loading' };
      }

      const study = studies[0].find(
        (study: any) => study.id === datasetId && !study.disabled
      );

      return study == null
        ? { status: 'not-found' }
        : { status: 'success', record: study };
    },
    [ studies ]
  );
}

export function useStudyAccessApi(
  baseStudyAccessUrl: string,
  fetchApi?: Window['fetch']
) {
  return useMemo(
    () => {
      const handler = createStudyAccessRequestHandler(baseStudyAccessUrl, fetchApi);
      return bindApiRequestCreators(apiRequests, handler);
    },
    []
  );
}

export function useUserPermissions(fetchPermissions: StudyAccessApi['fetchPermissions']) {
  return usePromise(
    async () => {
      const permissionsResponse = await fetchPermissions();

      return permissionsResponseToUserPermissions(
        permissionsResponse
      );
    },
    []
  );
}

export function useEndUserTableUiState(activeDatasetId: string) {
  const initialEndUserTableUiState: EndUserTableUiState = {
    approvalStatus: {},
    denialReason: {}
  };

  const [ endUserTableUiState, setEndUserTableUiState ] = useState(initialEndUserTableUiState);

  useEffect(() => {
    setEndUserTableUiState(initialEndUserTableUiState);
  }, [ activeDatasetId ]);

  return {
    endUserTableUiState,
    setEndUserTableUiState
  };
}

export function useOpenDialogConfig() {
  const [ openDialogConfig, setOpenDialogConfig ] = useState<OpenDialogConfig | undefined>(undefined);

  const changeOpenDialogConfig = useCallback((newDialogContentProps: ContentProps | undefined) => {
    if (newDialogContentProps == null) {
      setOpenDialogConfig(undefined);
    } else if (newDialogContentProps.type === 'access-denial') {
      setOpenDialogConfig({
        title: 'Denying Access',
        onClose: () => {
          setOpenDialogConfig(undefined);
        },
        content: <AccessDenialContent {...newDialogContentProps} />
      });
    } else if (newDialogContentProps.type === 'add-providers') {
      setOpenDialogConfig({
        title: 'Adding Providers',
        onClose: () => {
          setOpenDialogConfig(undefined);
        },
        content: <AddProvidersContent {...newDialogContentProps} />
      });
    } else if (newDialogContentProps.type === 'users-added') {
      setOpenDialogConfig({
        title: 'New Providers',
        onClose: () => {
          setOpenDialogConfig(undefined);
        },
        content: <UsersAddedContent {...newDialogContentProps} />
      })
    }
  }, []);

  return {
    openDialogConfig,
    changeOpenDialogConfig
  };
}

export function useStaffTableSectionConfig(
  userPermissions: UserPermissions | undefined,
  fetchStaffList: StudyAccessApi['fetchStaffList']
): StaffTableSectionConfig {
  const { value, loading } = usePromise(
    fetchIfAllowed(
      userPermissions && shouldDisplayStaffTable(userPermissions),
      fetchStaffList
    ),
    [ userPermissions ]
  );

  return useMemo(
    () => value == null
      ? {
          status: 'loading'
        }
      : value.type === 'not-allowed'
      ? {
          status: 'unavailable'
        }
      : {
          status: 'success',
          title: 'Staff',
          value: {
            rows: value.result.data.map(({ user, isOwner }) => ({
              userId: user.userId,
              name: `${user.firstName} ${user.lastName}`,
              email: user.email,
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
              email: {
                key: 'email',
                name: 'Email',
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
            columnOrder: [ 'userId', 'name', 'email', 'isOwner' ],
            idGetter: ({ userId }) => userId,
            initialSort: { columnKey: 'name', direction: 'asc' }
          }
        },
    [
      userPermissions,
      value,
      loading
    ]
  );
}

export function useProviderTableSectionConfig(
  userPermissions: UserPermissions | undefined,
  fetchProviderList: StudyAccessApi['fetchProviderList'],
  createProviderEntry: StudyAccessApi['createProviderEntry'],
  deleteProviderEntry: StudyAccessApi['deleteProviderEntry'],
  activeDatasetId: string,
  changeOpenDialogConfig: (newDialogContentProps: ContentProps | undefined) => void
): ProviderTableSectionConfig {
  const { value, loading, reload: reloadProvidersTable } = usePromiseWithReloadCallback(
    fetchIfAllowed(
      userPermissions && shouldDisplayProvidersTable(userPermissions, activeDatasetId),
      () => fetchProviderList(activeDatasetId)
    ),
    [ userPermissions, activeDatasetId ]
  );

  const providersAreUpdateable = userPermissions && canUpdateProviders(userPermissions, activeDatasetId);

  return useMemo(
    () => value == null
      ? {
          status: 'loading'
        }
      : value.type === 'not-allowed'
      ? {
          status: 'unavailable'
        }
      : {
          status: 'success',
          title: 'Providers',
          value: {
            rows: value.result.data.map(({ user, providerId, isManager }) => ({
              userId: user.userId,
              providerId,
              name: `${user.firstName} ${user.lastName}`,
              email: `${user.email}`,
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
              email: {
                key: 'email',
                name: 'Email',
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
            columnOrder: [ 'userId', 'name', 'email', 'isManager' ],
            idGetter: ({ userId }) => userId,
            initialSort: { columnKey: 'name', direction: 'asc' },
            actions: !providersAreUpdateable ? undefined : [
              {
                element: (
                  <button type="button" className="btn">
                    <IconAlt fa="plus" />
                    Add Providers
                  </button>
                ),
                callback: () => {
                  changeOpenDialogConfig({
                    type: 'add-providers',
                    onSubmit: async (providerEmails: string[]) => {
                      changeOpenDialogConfig(undefined);

                      const addedUsers = await Promise.all(
                        providerEmails.map(
                          providerEmail => createProviderEntry({
                            datasetId: activeDatasetId,
                            email: providerEmail,
                            isManager: false
                          })
                        )
                      );

                      const addedUsersWithEmails = zipWith(
                        addedUsers,
                        providerEmails,
                        (addedUser, email) => ({
                          ...addedUser,
                          email
                        })
                      );

                      const [ createdUsers, emailedUsers ] = partition(addedUsersWithEmails, ({ created }) => created);

                      changeOpenDialogConfig({
                        type: 'users-added',
                        createdUsers: createdUsers.map(({ email }) => email),
                        emailedUsers: emailedUsers.map(({ email }) => email),
                        permissionName: 'provider',
                        onConfirm: () => {
                          changeOpenDialogConfig(undefined);
                        }
                      });

                      reloadProvidersTable();
                    }
                  });
                }
              },
              {
                selectionRequired: true,
                element: selection => (
                  <button
                    type="button"
                    className="btn"
                    disabled={selection.length === 0}
                  >
                    <IconAlt fa="trash" />
                    Remove {selection.length === 1 ? 'Provider' : 'Providers'}
                  </button>
                ),
                callback: async (selection) => {
                  await Promise.all(
                    selection.map(({ providerId }) => deleteProviderEntry(providerId))
                  );

                  reloadProvidersTable();
                }
              }
            ]
          }
        },
    [
      userPermissions,
      value,
      loading,
      providersAreUpdateable
    ]
  );
}

export function useEndUserTableSectionConfig(
  userPermissions: UserPermissions | undefined,
  fetchEndUserList: StudyAccessApi['fetchEndUserList'],
  updateEndUserEntry: StudyAccessApi['updateEndUserEntry'],
  activeDatasetId: string,
  endUserTableUiState: EndUserTableUiState,
  setEndUserTableUiState: (newState: EndUserTableUiState) => void,
  changeOpenDialogConfig: (newDialogContentProps: ContentProps | undefined) => void
): EndUserTableSectionConfig {
  const { value, loading } = usePromise(
    fetchIfAllowed(
      userPermissions && shouldDisplayEndUsersTable(userPermissions, activeDatasetId),
      () => fetchEndUserList(activeDatasetId)
    ),
    [ userPermissions, activeDatasetId ]
  );

  const {
    approvalStatusEditable,
    onApprovalStatusChange
  } = useApprovalStatusColumnConfig(
    userPermissions,
    activeDatasetId,
    updateEndUserEntry,
    endUserTableUiState,
    setEndUserTableUiState,
    changeOpenDialogConfig
  );

  return useMemo(
    () => value == null
      ? {
          status: 'loading'
        }
      : value.type === 'not-allowed'
      ? {
          status: 'unavailable'
        }
      : {
          status: 'success',
          title: 'End Users',
          value: {
            rows: value.result.data.map(({
              user,
              startDate,
              approvalStatus,
              purpose = '',
              researchQuestion = '',
              analysisPlan = '',
              disseminationPlan = '',
              denialReason = ''
            }) => ({
              userId: user.userId,
              name: `${user.firstName} ${user.lastName}`,
              email: user.email,
              startDate,
              approvalStatus: endUserTableUiState.approvalStatus[user.userId] ?? approvalStatus,
              content: [ purpose, researchQuestion, analysisPlan, disseminationPlan ].join('\0'),
              purpose,
              researchQuestion,
              analysisPlan,
              disseminationPlan,
              denialReason: endUserTableUiState.denialReason[user.userId] ?? denialReason
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
              email: {
                key: 'email',
                name: 'Email',
                sortable: true
              },
              startDate: {
                key: 'startDate',
                name: 'Date Created',
                sortable: true,
                renderCell: ({ value }) => isoToUtcString(value),
                makeSearchableString: isoToUtcString
              },
              approvalStatus: {
                key: 'approvalStatus',
                name: 'Approval Status',
                sortable: true,
                renderCell: ({ value, row: { userId, name } }) => {
                  return !approvalStatusEditable
                    ? makeApprovalStatusDisplayName(value)
                    : <SingleSelect
                        items={makeApprovalStatusSelectItems(value)}
                        value={value}
                        onChange={(newValue) => {
                          onApprovalStatusChange(
                            userId,
                            name,
                            activeDatasetId,
                            newValue as ApprovalStatus
                          );
                        }}
                      />;
                }
              },
              content: {
                key: 'content',
                name: 'Content',
                sortable: false,
                width: '35em',
                renderCell: ({ row: { userId, purpose, researchQuestion, analysisPlan, disseminationPlan } }) => {
                  const contentFields = zipWith(
                    [ 'Purpose:', 'Research Question:', 'Analysis Plan:', 'Dissemination Plan:'],
                    [ purpose, researchQuestion, analysisPlan, disseminationPlan ],
                    (heading, field) => {
                      return field.length > 0
                        ? `${heading}\n${field}`
                        : undefined
                    }
                  );

                  const textValue = contentFields.filter(contentField => contentField != null).join('\n\n');

                  return <OverflowingTextCell key={userId} value={textValue} />;
                }
              },
              denialReason: {
                key: 'denialReason',
                name: 'Notes',
                sortable: false,
                width: '15em',
                renderCell: ({ value, row: { userId } }) =>
                  <OverflowingTextCell key={userId} value={value} />
              }
            },
            columnOrder: [
              'userId',
              'name',
              'email',
              'startDate',
              'approvalStatus',
              'content',
              'denialReason',
            ],
            idGetter: ({ userId }) => userId,
            initialSort: { columnKey: 'startDate', direction: 'desc' }
          }
        },
    [
      value,
      loading,
      approvalStatusEditable,
      onApprovalStatusChange,
      endUserTableUiState
    ]
  );
}

function useApprovalStatusColumnConfig(
  userPermissions: UserPermissions | undefined,
  activeDatasetId: string,
  updateEndUserEntry: StudyAccessApi['updateEndUserEntry'],
  endUserTableUiState: EndUserTableUiState,
  setEndUserTableUiState: (newState: EndUserTableUiState) => void,
  changeOpenDialogConfig: (newDialogContentProps: ContentProps | undefined) => void
) {
  const onApprovalStatusChange = useCallback(
    async (
      userId: number,
      userName: string,
      datasetId: string,
      newApprovalStatus: ApprovalStatus
    ) => {
      const oldApprovalStatus = endUserTableUiState.approvalStatus[userId];
      const oldDenialReason = endUserTableUiState.denialReason[userId];

      if (newApprovalStatus !== 'denied') {
        const denialReason = `${makeTimestampString()}: Status was changed to ${makeApprovalStatusDisplayName(newApprovalStatus)}.`;

        updateUiStateOptimistically(
          () => {
            updateEndUserApprovalStatus(
              endUserTableUiState,
              setEndUserTableUiState,
              userId,
              newApprovalStatus,
              denialReason
            );
          },
          async () => {
            await updateEndUserEntry(
              userId,
              datasetId,
              [
                {
                  op: 'replace',
                  path: '/approvalStatus',
                  value: newApprovalStatus
                },
                {
                  op: 'replace',
                  path: '/denialReason',
                  value: denialReason
                }
              ]
            );
          },
          () => {
            updateEndUserApprovalStatus(
              endUserTableUiState,
              setEndUserTableUiState,
              userId,
              oldApprovalStatus,
              oldDenialReason
            );
          }
        );
      } else {
        changeOpenDialogConfig({
          type: 'access-denial',
          userName,
          onSubmit: function(denialReason) {
            changeOpenDialogConfig(undefined);

            const fullDenialReason = `${makeTimestampString()}: Status was changed to ${makeApprovalStatusDisplayName('denied')}. Reason: ${denialReason}`;

            updateUiStateOptimistically(
              () => {
                updateEndUserApprovalStatus(
                  endUserTableUiState,
                  setEndUserTableUiState,
                  userId,
                  newApprovalStatus,
                  fullDenialReason
                );
              },
              async () => {
                await updateEndUserEntry(
                  userId,
                  datasetId,
                  [
                    {
                      op: 'replace',
                      path: '/approvalStatus',
                      value: newApprovalStatus
                    },
                    {
                      op: 'replace',
                      path: '/denialReason',
                      value: fullDenialReason
                    }
                  ]
                );
              },
              () => {
                updateEndUserApprovalStatus(
                  endUserTableUiState,
                  setEndUserTableUiState,
                  userId,
                  oldApprovalStatus,
                  oldDenialReason
                );
              }
            );
          }
        });
      }
    },
    [
      updateEndUserEntry,
      changeOpenDialogConfig,
      endUserTableUiState,
      setEndUserTableUiState
    ]
  );

  return {
    approvalStatusEditable: (
      userPermissions &&
      canUpdateApprovalStatus(userPermissions, activeDatasetId)
    ),
    onApprovalStatusChange
  };
}

type ConditionalFetchResult<T> =
  | { type: 'not-allowed' }
  | { type: 'allowed', result: T };

function fetchIfAllowed<T>(allowed: boolean | undefined, factory: () => Promise<T>): () => Promise<ConditionalFetchResult<T>> {
  return async () => !allowed
    ? { type: 'not-allowed' }
    : { type: 'allowed', result: await factory() };
}

function usePromiseWithReloadCallback<T>(factory: () => Promise<T>, deps?: any[]) {
  const [ reloadTime, setReloadTime ] = useState(Date.now());

  const reload = useCallback(
    () => {
      setReloadTime(Date.now())
    },
    []
  );

  const fullDeps = useMemo(
    () => deps == null
      ? [ reloadTime ]
      : [ ...deps, reloadTime ],
    [ deps, reloadTime ]
  );

  const promiseStatus = usePromise(factory, fullDeps);

  return {
    ...promiseStatus,
    reload
  };
}

async function updateUiStateOptimistically(
  optimisticUiStateUpdate: () => void,
  serviceUpdateCb: () => Promise<void>,
  rollbackUiStateUpdate: () => void
) {
  // Update the UI state optimistically
  optimisticUiStateUpdate();

  try {
    // Try to update the backend
    await serviceUpdateCb();
  } catch (e) {
    // If the backend update fails, rollback the optimistic UI state
    // update and throw an error
    rollbackUiStateUpdate();

    throw e;
  }
}

function updateEndUserApprovalStatus(
  endUserTableUiState: EndUserTableUiState,
  setEndUserTableUiState: (newState: EndUserTableUiState) => void,
  userId: number,
  newApprovalStatus: ApprovalStatus | undefined,
  newDenialReason: string | undefined
) {
  setEndUserTableUiState({
    ...endUserTableUiState,
    approvalStatus: {
      ...endUserTableUiState.approvalStatus,
      [userId]: newApprovalStatus
    },
    denialReason: {
      ...endUserTableUiState.denialReason,
      [userId]: newDenialReason
    }
  });
}

function booleanToString(value: boolean) {
  return value === true ? 'Yes' : 'No';
}

function makeApprovalStatusSelectItems(oldApprovalStatus: ApprovalStatus) {
  return permittedApprovalStatusChanges(oldApprovalStatus).map(permittedStatus => ({
    value: permittedStatus,
    display: makeApprovalStatusDisplayName(permittedStatus)
  }));
}

function makeApprovalStatusDisplayName(approvalStatus: ApprovalStatus) {
  return capitalize(approvalStatus);
}

function makeTimestampString() {
  return dateToUtcString(new Date());
}

function isoToUtcString(value: string | undefined) {
  return value == null
    ? ''
    : dateToUtcString(new Date(value))
}

function dateToUtcString(date: Date) {
  return date.toUTCString().replace(/^[A-Z][a-z][a-z],\s/i, '');
}
