import React, { useMemo } from 'react';

import { Loading } from 'wdk-client/Components';
import { useWdkService } from 'wdk-client/Hooks/WdkServiceHook';
import { useSetDocumentTitle } from 'wdk-client/Utils/ComponentUtils';

import { fetchStudies } from 'ebrc-client/App/Studies/StudyActionCreators';
import { StudyAccess } from 'ebrc-client/components/StudyAccess/StudyAccess';
import {
  useApprovalStatusState,
  useEndUserTableSectionConfig,
  useOpenDialogConfig,
  useProviderTableSectionConfig,
  useStaffTableSectionConfig,
  useStudyAccessRequestHandler
} from 'ebrc-client/hooks/studyAccess';

interface Props {
  datasetId: string;
}

// FIXME: This should be configurable
const STUDY_ACCESS_SERVICE_URL = '/dataset-access';

export default function StudyAccessController({ datasetId }: Props) {
  const study = useStudy(datasetId);

  const documentTitle = study == null
    ? 'Loading...'
    : `Study Access Dashboard: ${study.name}`;

  useSetDocumentTitle(documentTitle);

  const handler = useStudyAccessRequestHandler(STUDY_ACCESS_SERVICE_URL);

  const { approvalStatusState, updateUserApprovalStatus } = useApprovalStatusState(datasetId);

  const { openDialogConfig, updateOpenDialog } = useOpenDialogConfig();

  const staffTableConfig = useStaffTableSectionConfig(handler);
  const providerTableConfig = useProviderTableSectionConfig(handler, datasetId);
  const endUserTableConfig = useEndUserTableSectionConfig(
    handler,
    datasetId,
    approvalStatusState,
    updateUserApprovalStatus,
    updateOpenDialog
  );

  return (
    study == null
      ? <Loading />
      : <StudyAccess
          title={`Study: ${study.name}`}
          staffTableConfig={staffTableConfig}
          providerTableConfig={providerTableConfig}
          endUserTableConfig={endUserTableConfig}
          openDialogConfig={openDialogConfig}
        />
  );
}

function useStudy(datasetId: string) {
  const studies = useWdkService(fetchStudies, []);

  return useMemo(
    () => studies && studies[0].find(
      (study: any) => study.id === datasetId && !study.disabled
    ),
    [ studies ]
  );
}
