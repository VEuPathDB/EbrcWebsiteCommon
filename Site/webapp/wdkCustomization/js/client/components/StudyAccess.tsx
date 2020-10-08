import React from 'react';

import { Mesa, MesaState } from 'wdk-client/Components/Mesa';
import { MesaColumn } from 'wdk-client/Core/CommonTypes';

import { makeClassNameHelper } from 'wdk-client/Utils/ComponentUtils'

import { PublicStrategyResponse } from 'ebrc-client/StudyAccess/Types';

//import './StudyAccess.scss';

interface Props {
  studyId: string;
  response: PublicStrategyResponse;
}

const cx = makeClassNameHelper('StudyAccess');

export default function StudyAccess(props: Props) {
  return (
    <div className={cx()}>
      <Results {...props} />
    </div>
  )
}

function Results(props: Props) {
  const { response, studyId } = props;

  // access study info to show on page
  // access user profile

  if (response.length == 0) {
    return (
      <>
        <h1>Study : {studyId}</h1>
        <div style={{ textAlign: 'center', fontSize: '1.2em' }}>
          <p style={{ fontSize: '1.2em' }}>Dashboard empty.</p>
        </div>

      </>
    );
  }

  const tableState = MesaState.create({ 
    "rows": response,
    "columns": [
      {
        key: "releaseVersion"
      },
      {
        key: "name"
      }
    ] as MesaColumn[]
  });

  return (
    <>
      <div className={cx('--TitleLine')}>
        <h1>Study : {studyId}</h1>
      </div>
      <div className={cx('--Results')}>
        <Mesa state={tableState} />
        <pre>{JSON.stringify(response,null,2)}</pre>
      </div>
    </>
  )
}






