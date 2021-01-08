import React from "react";

import {
  Parameter,
  ParameterGroup,
  // ParamUIState divergent,
  QuestionWithParameters,
  RecordClass,
  ParameterValues,
  ParameterValue
} from 'wdk-client/Utils/WdkModel';
import { Dispatch } from 'redux';
import { Field, FilterField } from 'wdk-client/Components/AttributeFilter/Types';

export type ParameterGroupUI = ParameterGroup & {
  accumulatedTotal: number,
  valid: boolean,
  loading: boolean,
  selectedInPanel: boolean,
  countCanChangeInPanel: boolean,
  allValuesDefault: boolean
};

export type WizardState = {
  activeGroupIx: number,
  defaultParamValues: ParameterValues,
  filterPopupState: {
    visible: boolean,
    pinned: boolean  
  },
  parameterGroupUIs: ParameterGroupUI[],
  initialCount: number,
  paramUIState: Record<string, ParameterValues>,
  paramValues: ParameterValues,
  question: QuestionWithParameters,
  recordClass: RecordClass,
  updatingParamName?: string,
};
export type ParameterEventHandlers = {
  onParamValueChange: (parameter: Parameter, newParamValue: ParameterValue) => any,
  onSelectFilterParamField: (groupIx: number, parameter: Parameter, field: FilterField) => any
};
export type QuestionWizardProps = {
  searchName: string,
  recordClassName: string,
  customName?: string,
  setCustomName: (...args: any[]) => string,
  questionSummary?: string,
  isAddingStep: boolean,
  showHelpText: boolean,
  wizardState: WizardState,
  wizardEventHandlers: {
    onSelectGroup: (groupIx: number) => any,
    onParamValuesReset: (...args: any[]) => any,
    onInvalidGroupCountsUpdate: (...args: any[]) => any,
    onFilterPopupVisibilityChange: (...args: any[]) => any,
    onFilterPopupPinned: (...args: any[]) => any,
    onSubmit: (...args: any[]) => any
  },
  parameterEventHandlers: ParameterEventHandlers,
  dispatch: Dispatch,
  additionalHeadingContent?: React.ReactNode
};