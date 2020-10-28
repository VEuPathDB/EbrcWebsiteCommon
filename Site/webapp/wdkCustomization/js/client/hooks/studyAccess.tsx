import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { partition, zipWith } from 'lodash';

import { IconAlt, SingleSelect } from 'wdk-client/Components';
import { usePromise } from 'wdk-client/Hooks/PromiseHook';
import { OverflowingTextCell } from 'wdk-client/Views/Strategy/OverflowingTextCell';

import { ApprovalStatus } from 'ebrc-client/StudyAccess/Types';
import {
  createStudyAccessRequestHandler,
  deleteProviderEntry,
  fetchEndUserList,
  fetchProviderList,
  fetchStaffList,
  newProviderEntry,
  updateEndUserEntry
} from 'ebrc-client/StudyAccess/api';
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
import { ApiRequestHandler } from 'ebrc-client/util/api';

interface BaseTableRow {
  userId: number;
  name: string;
  // email: string;
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
  // requestDate: string;
  content: string;
  approvalStatus: ApprovalStatus;
  denialReason: string;
  // lastStatusUpdate: string;
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

export function useStudyAccessRequestHandler(
  baseStudyAccessUrl: string,
  fetchApi?: Window['fetch']
) {
  return useMemo(
    () => createStudyAccessRequestHandler(baseStudyAccessUrl, fetchApi),
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
            columnOrder: [ 'userId', 'name', 'isOwner' ],
            idGetter: ({ userId }) => userId
          }
        },
    [ value, loading ]
  );
}

export function useProviderTableSectionConfig(
  handler: ApiRequestHandler,
  activeDatasetId: string,
  changeOpenDialogConfig: (newDialogContentProps: ContentProps | undefined) => void
): ProviderTableSectionConfig {
  // FIXME: Fetch this data iff the user is a staff member or provider for the dataset
  const { value, loading, reload: reloadProvidersTable } = usePromiseWithReloadCallback(
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
            rows: value.data.map(({ user, providerId, isManager }) => ({
              userId: user.userId,
              providerId,
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
            columnOrder: [ 'userId', 'name', 'isManager' ],
            idGetter: ({ userId }) => userId,
            actions: [
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
                          providerEmail => newProviderEntry(handler, { datasetId: activeDatasetId, email: providerEmail, isManager: false })
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
                    selection.map(({ providerId }) => deleteProviderEntry(handler, providerId))
                  );

                  reloadProvidersTable();
                }
              }
            ]
          }
        },
    [ value, loading ]
  );
}

export function useEndUserTableSectionConfig(
  handler: ApiRequestHandler,
  activeDatasetId: string,
  endUserTableUiState: EndUserTableUiState,
  setEndUserTableUiState: (newState: EndUserTableUiState) => void,
  changeOpenDialogConfig: (newDialogContentProps: ContentProps | undefined) => void
): EndUserTableSectionConfig {
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

  const {
    approvalStatusItems,
    onApprovalStatusChange
  } = useApprovalStatusColumnConfig(
    handler,
    endUserTableUiState,
    setEndUserTableUiState,
    changeOpenDialogConfig
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
            rows: value.data.map(({
              user,
              approvalStatus,
              purpose = '',
              researchQuestion = '',
              analysisPlan = '',
              disseminationPlan = '',
              denialReason = ''
            }) => ({
              userId: user.userId,
              name: `${user.firstName} ${user.lastName}`,
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
              approvalStatus: {
                key: 'approvalStatus',
                name: 'Approval Status',
                sortable: true,
                renderCell: ({ value, row: { userId, name } }) =>
                  <SingleSelect
                    items={approvalStatusItems}
                    value={value}
                    onChange={(newValue) => {
                      onApprovalStatusChange(
                        userId,
                        name,
                        activeDatasetId,
                        newValue as ApprovalStatus
                      );
                    }}
                  />
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
                name: 'Reason For Denial',
                sortable: false,
                width: '15em',
                renderCell: ({ value, row: { userId } }) =>
                  <OverflowingTextCell key={userId} value={value} />
              }
            },
            columnOrder: [
              'userId',
              'name',
              'approvalStatus',
              'content',
              'denialReason',
            ],
            idGetter: ({ userId }) => userId
          }
        },
    [ value, loading, activeDatasetId, onApprovalStatusChange, endUserTableUiState ]
  );
}

function useApprovalStatusColumnConfig(
  handler: ApiRequestHandler,
  endUserTableUiState: EndUserTableUiState,
  setEndUserTableUiState: (newState: EndUserTableUiState) => void,
  changeOpenDialogConfig: (newDialogContentProps: ContentProps | undefined) => void
) {
  const approvalStatusItems = useMemo(
    () => [
      {
        value: 'requested',
        display: 'Requested'
      },
      {
        value: 'approved',
        display: 'Approved'
      },
      {
        value: 'denied',
        display: 'Denied'
      }
    ] as { value: ApprovalStatus, display: string }[],
    []
  );

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
        updateUiStateOptimistically(
          () => {
            updateEndUserApprovalStatus(
              endUserTableUiState,
              setEndUserTableUiState,
              userId,
              newApprovalStatus,
              undefined
            );
          },
          async () => {
            await updateEndUserEntry(
              handler,
              userId,
              datasetId,
              [
                {
                  op: 'replace',
                  path: '/approvalStatus',
                  value: newApprovalStatus
                },
                {
                  op: 'remove',
                  path: '/denialReason'
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
                  handler,
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
          }
        });
      }
    },
    [
      handler,
      changeOpenDialogConfig,
      endUserTableUiState,
      setEndUserTableUiState
    ]
  );

  return {
    approvalStatusItems,
    onApprovalStatusChange
  };
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
