import React from 'react';

import { makeClassNameHelper } from 'wdk-client/Utils/ComponentUtils'

//import './StudyAccess.scss';

interface Props {
  title: React.ReactNode;
  // visibleTables
  // tableConfigs
  // openDialog
}

const cx = makeClassNameHelper('StudyAccess');

export function StudyAccess({ title }: Props) {
  return (
    <div className={cx()}>
      <div className={cx('--TitleLine')}>
        <h1>{title}</h1>
      </div>
    </div>
  );
}
