import { capitalize, keyBy, add, isEmpty, isEqual, xor, intersection } from 'lodash';
import React, { useMemo, useState, useCallback, useContext, useEffect } from 'react';
import { Link, useHistory } from 'react-router-dom';

import { CheckboxTree, CheckboxList, CollapsibleSection, LoadingOverlay } from 'wdk-client/Components';
import { PaginationMenu, AnchoredTooltip } from 'wdk-client/Components/Mesa';
import { Mesa, MesaState } from 'wdk-client/Components/Mesa';

import { makeClassNameHelper, safeHtml } from 'wdk-client/Utils/ComponentUtils'
import { WdkDepdendenciesContext } from 'wdk-client/Hooks/WdkDependenciesEffect';
import { useWdkService } from 'wdk-client/Hooks/WdkServiceHook';

import { PublicStrategyResponse, StudyAccessResponse } from 'ebrc-client/StudyAccess/Types';
//import './StudyAccess.scss';

interface Props {
  loading: boolean;
  studyId: string;
  response: PublicStrategyResponse;
}

const cx = makeClassNameHelper('SiteSearch');
const cancelIcon = <i className="fa fa-times"/>;



export default function StudyAccess(props: Props) {

  return (
    <div className={cx()}>
      {props.loading && <LoadingOverlay>Loading results...</LoadingOverlay>}
      <Results {...props} />
    </div>
  )
}

function Results(props: Props) {
  const { response, studyId } = props;

  // access study info to show on page
  // access user profile

  if (response.publicStrats === undefined || response.publicStrats.length == 0 ) {
    return (
      <>
        <h1>Study : {studyId}</h1>
        <div style={{ textAlign: 'center', fontSize: '1.2em' }}>
          <p style={{ fontSize: '1.2em' }}>Dashboard empty.</p>
        </div>

      </>
    );
  }

 // const tableState = useTableState(props);
 // <Mesa state={tableState} />

  return (
    <>
      <div className={cx('--TitleLine')}>
        <h1>Study : {studyId}</h1>
      </div>
      <div className={cx('--Results')}>
        <pre>{JSON.stringify(response.publicStrats,null,2)}</pre>
  
      </div>
    </>
  )
}






