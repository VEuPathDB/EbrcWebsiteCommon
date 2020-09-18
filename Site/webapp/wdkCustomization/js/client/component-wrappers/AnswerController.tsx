import React from 'react';

import { memoize } from 'lodash';

import { AnswerOptions } from 'wdk-client/Actions/AnswerActions';
import { Props as AnswerControllerProps } from 'wdk-client/Controllers/AnswerController';
import { WdkService } from 'wdk-client/Core';
import { AttributeValue, RecordInstance } from 'wdk-client/Utils/WdkModel';

import { MONTHS } from 'ebrc-client/util/formatters';

export function AnswerController(DefaultComponent: React.ComponentType<AnswerControllerProps>) {
  return (props: AnswerControllerProps) => <DefaultComponent {...props} customSortBys={ebrcCustomSortBys} />;
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
