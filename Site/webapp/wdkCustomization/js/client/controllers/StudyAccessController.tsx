import React, { useMemo } from 'react';

import { Loading } from 'wdk-client/Components';
import { useWdkService } from 'wdk-client/Hooks/WdkServiceHook';
import { useSetDocumentTitle } from 'wdk-client/Utils/ComponentUtils';
import NotFound from 'wdk-client/Views/NotFound/NotFound';

import { fetchStudies } from 'ebrc-client/App/Studies/StudyActionCreators';
import { StudyAccess } from 'ebrc-client/components/StudyAccess/StudyAccess';
import {
  useEndUserTableSectionConfig,
  useEndUserTableUiState,
  useOpenDialogConfig,
  useProviderTableSectionConfig,
  useStaffTableSectionConfig,
  useStudyAccessRequestHandler,
  useUserPermissions
} from 'ebrc-client/hooks/studyAccess';

interface Props {
  datasetId: string;
}

// FIXME: This should be configurable
const STUDY_ACCESS_SERVICE_URL = '/dataset-access';

export default function StudyAccessController({ datasetId }: Props) {
  const study = useStudy(datasetId);

  const handler = useStudyAccessRequestHandler(STUDY_ACCESS_SERVICE_URL);

  const userPermissions = useUserPermissions(handler);

  const documentTitle = study.status === 'loading' || userPermissions == null
    ? 'Loading...'
    : study.status === 'not-found'
    ? 'Not Found'
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
      : <StudyAccess
          title={`Study: ${study.record.name}`}
          staffTableConfig={staffTableConfig}
          providerTableConfig={providerTableConfig}
          endUserTableConfig={endUserTableConfig}
          openDialogConfig={openDialogConfig}
        />
  );
}

type StudyStatus =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'success', record: any };

function useStudy(datasetId: string): StudyStatus {
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
