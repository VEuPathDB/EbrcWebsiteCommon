import React from 'react';

import { Loading, PermissionDenied } from 'wdk-client/Components';
import { useSetDocumentTitle } from 'wdk-client/Utils/ComponentUtils';
import NotFound from 'wdk-client/Views/NotFound/NotFound';

import { STUDY_ACCESS_SERVICE_URL } from 'ebrc-client/StudyAccess/api';
import { canAccessDashboard } from 'ebrc-client/StudyAccess/permission';
import { StudyAccess } from 'ebrc-client/components/StudyAccess/StudyAccess';
import {
  useEndUserTableSectionConfig,
  useEndUserTableUiState,
  useOpenDialogConfig,
  useProviderTableSectionConfig,
  useStaffTableSectionConfig,
  useStudy,
  useStudyAccessApi,
  useUserPermissions
} from 'ebrc-client/hooks/studyAccess';

interface Props {
  datasetId: string;
}

export default function StudyAccessController({ datasetId }: Props) {
  const study = useStudy(datasetId);

  const studyAccessApi = useStudyAccessApi(STUDY_ACCESS_SERVICE_URL);

  const { value: userPermissions } = useUserPermissions(studyAccessApi.fetchPermissions);

  const dashboardAccessAllowed = (
    userPermissions != null && canAccessDashboard(userPermissions, datasetId)
  );

  const documentTitle = study.status === 'loading' || userPermissions == null
    ? 'Loading...'
    : study.status === 'not-found'
    ? 'Not Found'
    : !dashboardAccessAllowed
    ? 'Permission Denied'
    : `Study Access Dashboard: ${study.record.name}`;

  useSetDocumentTitle(documentTitle);

  const {
    endUserTableUiState,
    setEndUserTableUiState
  } = useEndUserTableUiState(datasetId);

  const { openDialogConfig, changeOpenDialogConfig } = useOpenDialogConfig();

  const staffTableConfig = useStaffTableSectionConfig(
    userPermissions,
    studyAccessApi.fetchStaffList
  );
  const providerTableConfig = useProviderTableSectionConfig(
    userPermissions,
    studyAccessApi.fetchProviderList,
    studyAccessApi.createProviderEntry,
    studyAccessApi.deleteProviderEntry,
    datasetId,
    changeOpenDialogConfig
  );
  const endUserTableConfig = useEndUserTableSectionConfig(
    userPermissions,
    studyAccessApi.fetchEndUserList,
    studyAccessApi.updateEndUserEntry,
    datasetId,
    endUserTableUiState,
    setEndUserTableUiState,
    changeOpenDialogConfig
  );

  return (
    study.status == 'loading' || userPermissions == null
      ? <Loading />
      : study.status == 'not-found'
      ? <NotFound />
      : !dashboardAccessAllowed
      ? <PermissionDenied />
      : <StudyAccess
          title={`Study: ${study.record.name}`}
          staffTableConfig={staffTableConfig}
          providerTableConfig={providerTableConfig}
          endUserTableConfig={endUserTableConfig}
          openDialogConfig={openDialogConfig}
        />
  );
}
