import React from "react";

import {
  Parameter,
  ParameterGroup,
  // ParamUIState,
  QuestionWithParameters,
  RecordClass,
  ParameterValues
} from 'wdk-client/Utils/WdkModel';

// divergent
export type ParamUIState = Record<string, ParameterValues>;

// divergent
type GroupState = {
  accumulatedTotal: number,
  valid: boolean,
  loading: boolean
}

export type GroupUIState = Record<string, GroupState>;

export type WizardNavState = {
  filterPopupState: {
    visible: boolean,
    pinned: boolean
  },
  updatingParamName: boolean,
  activeGroup?: ParameterGroup,
  initialCount: number
}
export type WizardState = WizardNavState & {
  // These two are divergent from the store
  paramUIState: ParamUIState,
  groupUIState: GroupUIState,
  // These are redundant with the store
  recordClass: RecordClass,
  question: QuestionWithParameters,
  paramValues: ParameterValues,
  defaultParamValues: ParameterValues,
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
