import React from "react";

import {
  Parameter,
  ParameterGroup,
  QuestionWithParameters,
  RecordClass,
  ParameterValues
} from 'wdk-client/Utils/WdkModel';

export type ParamUIState = Record<string, ParameterValues>;

type GroupState = {
  accumulatedTotal: number,
  valid: boolean,
  loading: boolean
}
export type GroupUIState = Record<string, GroupState>;

export type WizardState = {
  question: QuestionWithParameters,
  paramValues: ParameterValues,
  defaultParamValues: ParameterValues,
  filterPopupState: {
    visible: boolean,
    pinned: boolean
  },
  updatingParamName: boolean,
  paramUIState: ParamUIState,
  groupUIState: GroupUIState,
  recordClass: RecordClass,
  activeGroup?: ParameterGroup,
  initialCount: number
};

export type QuestionWizardProps = {
  customName?: string,
  setCustomName: (...args: any[]) => string,
  questionSummary?: string,
  isAddingStep: boolean,
  showHelpText: boolean,
  wizardState: WizardState,
  wizardEventHandlers: {
    onGroupSelect: (...args: any[]) => any,
    onInvalidGroupCountsUpdate: (...args: any[]) => any,
    onFilterPopupVisibilityChange: (...args: any[]) => any,
    onFilterPopupPinned: (...args: any[]) => any,
    onSubmit: (...args: any[]) => any
  },
  parameterEventHandlers: {
    onOntologyTermSelect: (...args: any[]) => any,
    onOntologyTermSummaryUpdate: (...args: any[]) => any,
    onOntologyTermSort: (...args: any[]) => any,
    onOntologyTermSearch: (...args: any[]) => any,
    onParamValueChange: (...args: any[]) => any,
    onParamStateChange: (...args: any[]) => any
  },
  additionalHeadingContent?: React.ReactNode
};
