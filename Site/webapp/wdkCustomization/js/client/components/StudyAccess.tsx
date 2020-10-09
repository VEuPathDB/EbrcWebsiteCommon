import React from 'react';

import { makeClassNameHelper } from 'wdk-client/Utils/ComponentUtils'

//import './StudyAccess.scss';

interface Props {
  studyId: string;
}

const cx = makeClassNameHelper('StudyAccess');

export default function StudyAccess({ studyId }: Props) {
  return (
    <div className={cx()}>
      <div className={cx('--TitleLine')}>
        <h1>Study : {studyId}</h1>
      </div>
      Future home of User Access Dashboard for {studyId}
    </div>
  );
}
