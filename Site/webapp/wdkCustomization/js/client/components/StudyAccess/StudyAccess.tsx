import React from 'react';

import { makeClassNameHelper } from 'wdk-client/Utils/ComponentUtils';

import { UserTableSection } from 'ebrc-client/components/StudyAccess/UserTableSection';
import {
  EndUserTableSectionConfig,
  ProviderTableSectionConfig,
  StaffTableSectionConfig
} from 'ebrc-client/hooks/studyAccess';

//import './StudyAccess.scss';

interface Props {
  title: React.ReactNode;
  staffTableConfig: StaffTableSectionConfig;
  providerTableConfig: ProviderTableSectionConfig;
  endUserTableConfig: EndUserTableSectionConfig;
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
      <UserTableSection {...staffTableConfig} />
      <UserTableSection {...providerTableConfig} />
      <UserTableSection {...endUserTableConfig} />
    </div>
  );
}
