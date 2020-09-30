import { castArray, isArray } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { decode } from 'wdk-client/Utils/Json';
import { useHistory } from 'react-router';
import { useQueryParams } from 'ebrc-client/hooks/queryParams';

import { Loading, Error as ErrorPage } from 'wdk-client/Components';
import { usePromise } from 'wdk-client/Hooks/PromiseHook';
import { useWdkService } from 'wdk-client/Hooks/WdkServiceHook';

import { useSetDocumentTitle } from 'wdk-client/Utils/ComponentUtils';

import StudyAccess from '../components/StudyAccess';
import { publicStrategyResponse, PublicStrategyResponse, GetStaffTableResponse, StudyAccessResponse, StudyAccessRequest } from 'ebrc-client/StudyAccess/Types';
import { studyAccessServiceUrl } from 'ebrc-client/config';

const publicStratsUrl = "https://aurreco.gates.clinepidb.org/ce/service/strategy-lists/public";

type Props = {
  datasetId: string 
}

export default function StudyAccessController(props: Props) {

  useSetDocumentTitle('Public Strategies Dashboard');
  const studyId = props.datasetId;
  const wdkAuth = "testWdkAuth";

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

  const { value, loading } = useStudyAccessResponse();

  if (value && value.type === 'error') {
    return (
      <ErrorPage message={value.error.message}/>
    )
  }

  if (value == null ) {
    return <Loading/>;
  }

  return (
    <StudyAccess
      loading={loading}
      studyId={studyId}
      response={value.response}
    />
  )
}



type Value =
  | { type: 'error', error: Error }
  | { type: 'success', response: PublicStrategyResponse };

function useStudyAccessResponse() {

 // const user$ = wdkService.getCurrentUser();

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


async function runPostRequest(requestBody: StudyAccessRequest): Promise<string> {
  const response = await fetch(`${studyAccessServiceUrl}`, {
    method: 'POST',
    body: JSON.stringify(requestBody),
    headers: {
      'Content-Type': 'application/json'
    },
    mode: 'cors'
  });

  if (!response.ok) {
    throw new Error(response.statusText);
  }
  return await response.text();
}



