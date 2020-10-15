import React from 'react';

import { Loading } from 'wdk-client/Components';
import { makeClassNameHelper } from 'wdk-client/Utils/ComponentUtils';

import {
  EndUserTableConfig,
  ProviderTableConfig,
  StaffTableConfig
} from 'ebrc-client/hooks/studyAccess';
import { UserTable } from './UserTable';

//import './StudyAccess.scss';

interface Props {
  title: React.ReactNode;
  staffTableConfig: StaffTableConfig;
  providerTableConfig: ProviderTableConfig;
  endUserTableConfig: EndUserTableConfig;
}

const cx = makeClassNameHelper('StudyAccess');

export function StudyAccess({
  title,
  staffTableConfig,
  providerTableConfig,
  endUserTableConfig
}: Props) {
  return (
    <div className={cx()}>
      <div className={cx('--TitleLine')}>
        <h1>{title}</h1>
      </div>
      {
        staffTableConfig.status === 'success' &&
        <UserTable {...staffTableConfig.value} />
      }
      {
        providerTableConfig.status === 'success' &&
        <UserTable {...providerTableConfig.value} />
      }
      {
        endUserTableConfig.status === 'success' &&
        <UserTable {...endUserTableConfig.value} />
      }
    </div>
  );
}
