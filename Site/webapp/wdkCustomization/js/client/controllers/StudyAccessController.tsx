import React from 'react';
import { decode } from 'wdk-client/Utils/Json';

import { Loading, Error as ErrorPage } from 'wdk-client/Components';
import { usePromise } from 'wdk-client/Hooks/PromiseHook';
import { useWdkService } from 'wdk-client/Hooks/WdkServiceHook';
import { useSetDocumentTitle } from 'wdk-client/Utils/ComponentUtils';

import { publicStrategyResponse, PublicStrategyResponse } from 'ebrc-client/StudyAccess/Types';
import { webAppUrl } from 'ebrc-client/config';

import StudyAccess from 'ebrc-client/components/StudyAccess';

const publicStratsUrl = `${webAppUrl}/service/strategy-lists/public`;

interface Props {
  datasetId: string;
}

export default function StudyAccessController({ datasetId }: Props) {
  useSetDocumentTitle('Public Strategies Dashboard');

  if (!publicStratsUrl) {
    return (
      <div>
        <h1>Oops... Search is unavailable!</h1>
        <div>
          This site is not configured to use search. Please contact an administrator.
        </div>
      </div>
    )
  }

  const { value } = useStudyAccessResponse();

  return value == null
    ? <Loading />
    : value.type === 'error'
    ? <ErrorPage message={value.error.message} />
    : <StudyAccess
        studyId={datasetId}
        response={value.response}
      />;
}

type Value =
  | { type: 'error', error: Error }
  | { type: 'success', response: PublicStrategyResponse };

function useStudyAccessResponse() {
  const projectId = useWdkService(async wdkService => {
    const { projectId } = await wdkService.getConfig();
    return projectId;
  }, []);

  return usePromise(async (): Promise<Value|undefined> => {
    if (!publicStratsUrl || projectId == null) return undefined;
    try {
      const responseText = await runGetRequest();
      const validatedResponse = decode(publicStrategyResponse, responseText);
      return {
        type: 'success',
        response: validatedResponse
      };
    }
    catch(error) {
      return { type: 'error', error };
    }
  }, [ projectId ]);
}


// ==============================================

async function runGetRequest(): Promise<string> {
  const response = await fetch(`${publicStratsUrl}`, {
    method: 'GET',
    headers: {
      //'Auth_Key': wdk-auth,
      'Content-Type': 'application/json'
    },
    mode: 'cors'
  });

  if (!response.ok) {
    throw new Error(response.statusText);
  }
  return await response.text();
}
