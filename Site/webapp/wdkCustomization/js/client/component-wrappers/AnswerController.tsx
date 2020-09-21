import React, { useContext, useMemo } from 'react';

import { memoize } from 'lodash';

import { IconAlt } from 'wdk-client/Components';
import {
  DEFAULT_PAGINATION,
  DEFAULT_SORTING,
  Props as AnswerControllerProps
} from 'wdk-client/Controllers/AnswerController';
import { WdkService } from 'wdk-client/Core';
import { WdkServiceContext } from 'wdk-client/Service/WdkService';
import {
  AttributeValue,
  ParameterValues,
  RecordInstance
} from 'wdk-client/Utils/WdkModel';

import { MONTHS } from 'ebrc-client/util/formatters';

import './AnswerController.scss';

const DOWNLOAD_REPORTER_NAME = 'attributesTabular';
const DOWNLOAD_FORMAT = 'csv';

export function AnswerController(DefaultComponent: React.ComponentType<AnswerControllerProps>) {
  return (props: AnswerControllerProps) => {
    const additionalActions = useAdditionalActions(props);

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

function useAdditionalActions(props: AnswerControllerProps) {
  const onDownloadButtonClick = useOnDownloadButtonClick(props);

  return useMemo(
    () => onDownloadButtonClick == null
      ? []
      : [
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

function useOnDownloadButtonClick(props: AnswerControllerProps) {
  const wdkService = useContext(WdkServiceContext);

  const { parameters } = props.ownProps;

  const {
    allAttributes,
    question,
    recordClass
  } = props.stateProps;

  return useMemo(
    () => {
      if (
        wdkService == null ||
        allAttributes == null ||
        recordClass == null ||
        question == null
      ) {
        return undefined;
      }

      // We only offer a download button for answers whose
      // record class offers the nececessary reporter
      const reporterAvailable = recordClass?.formats.some(
        ({ name }) => name === DOWNLOAD_REPORTER_NAME
      );

      if (!reporterAvailable) {
        return undefined;
      }

      return () => {
        downloadAnswer(
          wdkService,
          question.urlSegment,
          parameters ?? {},
          allAttributes
            .filter(({ isDisplayable }) => isDisplayable)
            .map(({ name }) => name),
        );
      }
    },
    [ wdkService, question?.urlSegment, parameters, allAttributes ]
  )
}

export function downloadAnswer(
  wdkService: WdkService,
  searchName: string,
  parameters: ParameterValues,
  attributes: string[]
) {
  return wdkService.downloadAnswer({
    answerSpec: {
      searchName,
      searchConfig: {
        parameters
      }
    },
    formatting: {
      format: DOWNLOAD_REPORTER_NAME,
      formatConfig: {
        attachmentType: DOWNLOAD_FORMAT,
        attributes,
        pagination: DEFAULT_PAGINATION,
        sorting: DEFAULT_SORTING
      }
    }
  });
}
