import React from 'react';

import { Loading, PermissionDenied } from 'wdk-client/Components';
import { useSetDocumentTitle } from 'wdk-client/Utils/ComponentUtils';
import NotFound from 'wdk-client/Views/NotFound/NotFound';

import { StudyAccess } from 'ebrc-client/components/StudyAccess/StudyAccess';
import {
  useEndUserTableSectionConfig,
  useEndUserTableUiState,
  useOpenDialogConfig,
  useProviderTableSectionConfig,
  useStaffTableSectionConfig,
  useStudy,
  useStudyAccessRequestHandler,
  useUserPermissions
} from 'ebrc-client/hooks/studyAccess';
import { isDashboardAccessAllowed } from 'ebrc-client/StudyAccess/permission';

interface Props {
  datasetId: string;
}

// FIXME: This should be configurable
const STUDY_ACCESS_SERVICE_URL = '/dataset-access';

export default function StudyAccessController({ datasetId }: Props) {
  const study = useStudy(datasetId);

  const handler = useStudyAccessRequestHandler(STUDY_ACCESS_SERVICE_URL);

  const { value: userPermissions } = useUserPermissions(handler);

  const dashboardAccessAllowed = (
    userPermissions != null && isDashboardAccessAllowed(userPermissions, datasetId)
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

  const staffTableConfig = useStaffTableSectionConfig(handler);
  const providerTableConfig = useProviderTableSectionConfig(
    handler,
    datasetId,
    changeOpenDialogConfig
  );
  const endUserTableConfig = useEndUserTableSectionConfig(
    handler,
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
