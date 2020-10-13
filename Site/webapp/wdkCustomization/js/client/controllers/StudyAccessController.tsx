import React from 'react';

import { Loading, Error as ErrorPage } from 'wdk-client/Components';
import { useSetDocumentTitle } from 'wdk-client/Utils/ComponentUtils';

import { StudyAccess } from 'ebrc-client/components/StudyAccess/StudyAccess';

interface Props {
  datasetId: string;
}

export default function StudyAccessController({ datasetId }: Props) {
  useSetDocumentTitle(`User Access Dashboard: ${datasetId}`);

  const value = useStudyAccessResponse();

  return value == null
    ? <Loading />
    : value.type === 'error'
    ? <ErrorPage message={value.message} />
    : <StudyAccess
        title={`Study : ${datasetId}`}
      />;
}

type Response<T> =
  | { type: 'error', status: string, message: string }
  | { type: 'success', value: T };

function useStudyAccessResponse(): Response<string> | undefined {
  return {
    type: 'success',
    value: 'Hello World'
  };
}
