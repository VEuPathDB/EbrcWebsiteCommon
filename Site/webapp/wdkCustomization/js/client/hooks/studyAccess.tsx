import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { SingleSelect } from 'wdk-client/Components';
import { usePromise } from 'wdk-client/Hooks/PromiseHook';
import { OverflowingTextCell } from 'wdk-client/Views/Strategy/OverflowingTextCell';

import { ApprovalStatus } from 'ebrc-client/StudyAccess/Types';
import {
  createStudyAccessRequestHandler,
  fetchEndUserList,
  fetchProviderList,
  fetchStaffList,
  updateEndUserEntry
} from 'ebrc-client/StudyAccess/api';

import {
  Props as UserTableSectionConfig
} from 'ebrc-client/components/StudyAccess/UserTableSection';
import { ApiRequestHandler } from 'ebrc-client/util/api';

interface BaseTableRow {
  userId: number;
  name: string;
  // email: string;
}

export interface StaffTableRow extends BaseTableRow {
  isOwner: boolean;
}

export interface ProviderTableRow extends BaseTableRow {
  isManager: boolean;
}


export interface EndUserTableRow extends BaseTableRow {
  // requestDate: string;
  approvalStatus: ApprovalStatus;
  purpose: string;
  researchQuestion: string;
  analysisPlan: string;
  disseminationPlan: string;
  denialReason: string;
  // lastStatusUpdate: string;
}

export type StaffTableSectionConfig = UserTableSectionConfig<StaffTableRow, keyof StaffTableRow>;
export type ProviderTableSectionConfig = UserTableSectionConfig<ProviderTableRow, keyof ProviderTableRow>;
export type EndUserTableSectionConfig = UserTableSectionConfig<EndUserTableRow, keyof EndUserTableRow>;

type ApprovalStatusState = Record<number, ApprovalStatus | undefined>;

export function useStudyAccessRequestHandler(
  baseStudyAccessUrl: string,
  fetchApi?: Window['fetch']
) {
  return useMemo(
    () => createStudyAccessRequestHandler(baseStudyAccessUrl, fetchApi),
    []
  );
}

export function useApprovalStatusState(activeDatasetId: string) {
  const initialApprovalStatusState: ApprovalStatusState = {};

  const [ approvalStatusState, setApprovalStatusState ] = useState(initialApprovalStatusState);

  useEffect(() => {
    setApprovalStatusState(initialApprovalStatusState);
  }, [ activeDatasetId ]);

  const updateUserApprovalStatus = useCallback(
    (userId: number, newApprovalStatus: ApprovalStatus | undefined) => {
      setApprovalStatusState({
        ...approvalStatusState,
        [userId]: newApprovalStatus
      });
    },
    [ approvalStatusState ]
  );

  return {
    approvalStatusState,
    updateUserApprovalStatus
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

export function useEndUserTableSectionConfig(
  handler: ApiRequestHandler,
  activeDatasetId: string,
  approvalStatusState: ApprovalStatusState,
  updateUserApprovalStatus: (userId: number, newApprovalStatus: ApprovalStatus | undefined) => void
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
  } = useApprovalStatusColumnConfig(handler, approvalStatusState, updateUserApprovalStatus);

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
              approvalStatus: approvalStatusState[user.userId] ?? approvalStatus,
              purpose,
              researchQuestion,
              analysisPlan,
              disseminationPlan,
              denialReason
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
                renderCell: ({ value, row: { userId } }) =>
                  <SingleSelect
                    items={approvalStatusItems}
                    value={value}
                    onChange={(newValue) => {
                      onApprovalStatusChange(
                        userId,
                        activeDatasetId,
                        newValue as ApprovalStatus
                      );
                    }}
                  />
              },
              purpose: {
                key: 'purpose',
                name: 'Purpose',
                sortable: true,
                width: '25em',
                renderCell: ({ value, row: { userId } }) =>
                  <OverflowingTextCell key={userId} value={value} />
              },
              researchQuestion: {
                key: 'researchQuestion',
                name: 'Research Question',
                sortable: true,
                width: '25em',
                renderCell: ({ value, row: { userId } }) =>
                  <OverflowingTextCell key={userId} value={value} />
              },
              analysisPlan: {
                key: 'analysisPlan',
                name: 'Analysis Plan',
                sortable: true,
                width: '25em',
                renderCell: ({ value, row: { userId } }) =>
                  <OverflowingTextCell key={userId} value={value} />
              },
              disseminationPlan: {
                key: 'disseminationPlan',
                name: 'Dissemination Plan',
                sortable: true,
                width: '25em',
                renderCell: ({ value, row: { userId } }) =>
                  <OverflowingTextCell key={userId} value={value} />
              },
              denialReason: {
                key: 'denialReason',
                name: 'Reason For Denial',
                sortable: true,
                width: '15em',
                renderCell: ({ value, row: { userId } }) =>
                  <OverflowingTextCell key={userId} value={value} />
              }
            },
            columnOrder: [
              'userId',
              'name',
              'approvalStatus',
              'denialReason',
              'purpose',
              'researchQuestion',
              'analysisPlan',
              'disseminationPlan'
            ]
          }
        },
    [ value, loading, activeDatasetId, approvalStatusState ]
  );
}

function useApprovalStatusColumnConfig(
  handler: ApiRequestHandler,
  approvalStatusState: ApprovalStatusState,
  updateUserApprovalStatus: (userId: number, newApprovalStatus: ApprovalStatus | undefined) => void
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
      datasetId: string,
      newApprovalStatus: ApprovalStatus
    ) => {
      const oldApprovalStatus = approvalStatusState[userId];

      if (newApprovalStatus !== 'denied') {
        updateUiStateOptimistically(
          () => {
            updateUserApprovalStatus(userId, newApprovalStatus);
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
            updateUserApprovalStatus(userId, oldApprovalStatus);
          }
        );
      } else {
        const denialReason = prompt('Please provide a reason for denying this request: ');

        if (denialReason != null) {
          updateUiStateOptimistically(
            () => {
              updateUserApprovalStatus(userId, newApprovalStatus);
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
                    value: 'denied'
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
              updateUserApprovalStatus(userId, oldApprovalStatus);
            }
          );
        }
      }
    },
    [ handler, updateUserApprovalStatus, approvalStatusState ]
  );

  return {
    approvalStatusItems,
    approvalStatusState,
    onApprovalStatusChange
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

function booleanToString(value: boolean) {
  return value === true ? 'Yes' : 'No';
}
