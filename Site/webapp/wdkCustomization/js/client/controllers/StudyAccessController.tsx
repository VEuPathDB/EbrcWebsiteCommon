import React from 'react';

import { useSetDocumentTitle } from 'wdk-client/Utils/ComponentUtils';

import { StudyAccess } from 'ebrc-client/components/StudyAccess/StudyAccess';
import {
  useEndUserTableSectionConfig,
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
  useSetDocumentTitle(`User Access Dashboard: ${datasetId}`);

  const handler = useStudyAccessRequestHandler(STUDY_ACCESS_SERVICE_URL);

  const staffTableConfig = useStaffTableSectionConfig(handler);
  const providerTableConfig = useProviderTableSectionConfig(handler, datasetId);
  const endUserTableConfig = useEndUserTableSectionConfig(handler, datasetId);

  return (
    <StudyAccess
      title={`Study : ${datasetId}`}
      staffTableConfig={staffTableConfig}
      providerTableConfig={providerTableConfig}
      endUserTableConfig={endUserTableConfig}
    />
  );
}
