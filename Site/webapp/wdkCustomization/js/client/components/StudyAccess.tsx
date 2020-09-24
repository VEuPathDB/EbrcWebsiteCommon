import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { noop } from 'lodash';
import { TextArea, Loading, HelpIcon, Tabs, Link } from 'wdk-client/Components';
import { RootState } from 'wdk-client/Core/State/Types';
import { useWdkService } from 'wdk-client/Hooks/WdkServiceHook';
import { makeClassNameHelper } from 'wdk-client/Utils/ComponentUtils';

export default function StudyAccess() {
  return (
    <div id="dashboard">
      <h1>Study Access Dashboard</h1>
   </div>       
  );
}

