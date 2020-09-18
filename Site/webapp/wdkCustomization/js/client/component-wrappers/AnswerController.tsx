import React, { useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { memoize } from 'lodash';

import { AnswerOptions } from 'wdk-client/Actions/AnswerActions';
import { IconAlt } from 'wdk-client/Components';
import {
  DEFAULT_PAGINATION,
  DEFAULT_SORTING,
  Props as AnswerControllerProps
} from 'wdk-client/Controllers/AnswerController';
import { WdkService } from 'wdk-client/Core';
import { RootState } from 'wdk-client/Core/State/Types';
import { WdkServiceContext } from 'wdk-client/Service/WdkService';
import { AttributeValue, RecordInstance, ParameterValues } from 'wdk-client/Utils/WdkModel';

import { MONTHS } from 'ebrc-client/util/formatters';

import './AnswerController.scss';

export function AnswerController(DefaultComponent: React.ComponentType<AnswerControllerProps>) {
  return (props: AnswerControllerProps) => {
    const additionalActions = useAdditionalActions(props.ownProps.parameters);

    return (
      <DefaultComponent
        {...props}
        customSortBys={ebrcCustomSortBys}
        additionalActions={additionalActions}
      />
    );
  };
}

const ebrcCustomSortBys = {
  eupath_release: [
    (record: RecordInstance) => eupathReleaseToSortKey(record.attributes.eupath_release)[0],
    (record: RecordInstance) => eupathReleaseToSortKey(record.attributes.eupath_release)[1],
    (record: RecordInstance) => eupathReleaseToSortKey(record.attributes.eupath_release)[2],
    (record: RecordInstance) => eupathReleaseToSortKey(record.attributes.eupath_release)[3],
    (record: RecordInstance) => eupathReleaseToSortKey(record.attributes.eupath_release)[4]
  ]
};

const EUPATH_RELEASE_REGEX = new RegExp(/(\w+)\s(\d+\.?\d*)\s\/\s(\d\d)-(\w\w\w)-(\d\d)/);

const MONTH_VALUES = MONTHS.reduce(
  (memo, month, i) => ({
    ...memo,
    [month.toUpperCase().slice(0, 3)]: i
  }), 
  {} as Record<string, number>
);

const eupathReleaseToSortKey = memoize((eupathRelease: AttributeValue) => {
  if (typeof eupathRelease !== 'string') {
    return [ null, null, null, null, null ];
  }

  const [ , projectName, versionStr, releaseDayStr, releaseMonthStr, releaseYearStr ] = 
    eupathRelease.match(EUPATH_RELEASE_REGEX) || [];

  return [
    Number(releaseYearStr),
    MONTH_VALUES[releaseMonthStr],
    Number(releaseDayStr),
    projectName,
    Number(versionStr)
  ];
});

function useAdditionalActions(parameters?: ParameterValues) {
  const onDownloadButtonClick = useOnDownloadButtonClick(parameters);

  return useMemo(
    () => [
      {
        key: 'download',
        display: (
          <button className="btn" onClick={onDownloadButtonClick}>
            <IconAlt fa="download" />
            Download
          </button>
        )
      }
    ],
    [ onDownloadButtonClick ]
  )
}

function useOnDownloadButtonClick(parameters?: ParameterValues) {
  const wdkService = useContext(WdkServiceContext);

  const allAttributes = useSelector((state: RootState) => state.answerView.allAttributes);
  const question = useSelector((state: RootState) => state.answerView.question);

  if (wdkService == null || allAttributes == null || question == null) {
    return undefined;
  }

  return () => {
    downloadAnswer(
      wdkService,
      question.urlSegment,
      {
        parameters,
        displayInfo: {
          attributes: allAttributes
            .filter(({ isDisplayable }) => isDisplayable)
            .map(({ name }) => name),
          customName: '',
          pagination: DEFAULT_PAGINATION,
          sorting: DEFAULT_SORTING
        }
      }
    );
  };
}

export function downloadAnswer(
  wdkService: WdkService,
  searchName: string,
  {
    displayInfo: {
      attributes,
      pagination,
      sorting
    },
    parameters = {}
  }: AnswerOptions
){
  return wdkService.downloadAnswer({
    answerSpec: {
      searchName,
      searchConfig: {
        parameters
      }
    },
    formatting: {
      format: 'attributesTabular',
      formatConfig: {
        attachmentType: 'csv',
        attributes,
        pagination,
        sorting
      }
    }
  });
}
