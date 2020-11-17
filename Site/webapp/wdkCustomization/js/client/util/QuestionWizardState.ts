// Wizard state utility functions

import { some, every, fromPairs } from 'lodash';

import {
  Parameter,
  ParameterGroup,
  QuestionWithParameters,
  RecordClass,
  ParameterValues
} from 'wdk-client/Utils/WdkModel';

import {
  ParameterGroupUI,
  WizardState
} from './WizardTypes'

import {
  GroupState
} from 'wdk-client/StoreModules/QuestionStoreModule'

import {
  State as FilterParamState
} from 'wdk-client/Views/Question/Params/FilterParamNew/State'

export function constructInitialCount(question: QuestionWithParameters, paramUIState: WizardState['paramUIState'], activeGroupIx: number): number{

  return (activeGroupIx > -1 && question.parameters?.[0].type === 'filter' &&
    ((paramUIState[question.parameters?.[0].name] as unknown) as FilterParamState).unfilteredCount || 0
  );

}
export function constructParameterGroupUIs(question: QuestionWithParameters, paramValues: ParameterValues, defaultParamValues: ParameterValues, groupUIState: Record<string, GroupState>, activeGroupIx: number): ParameterGroupUI[]{

  return question.groups.map((group, ix) => Object.assign({},
    group,
    { 
      selectedInPanel: ix === activeGroupIx,
      countCanChangeInPanel:
        ix === activeGroupIx || ( activeGroupIx > -1 && ix === activeGroupIx + 1 )
    },
    {
      valid: groupUIState[group.name]?.filteredCountIsValid,
      loading: groupUIState[group.name]?.loadingFilteredCount,
      accumulatedTotal: groupUIState[group.name]?.filteredCount || 0,
    },
    { allValuesDefault: 
       every(group.parameters.map(paramName => 
         paramValues[paramName] == defaultParamValues[paramName]
      ))
    }
  ));
}

// Immutable state modifiers
// -------------------------

/**
 * Show or hide popup with filter summary.
 * @param {WizardState} wizardState
 * @param {boolean} visiblity
 * @return {WizardState}
 */
export function setFilterPopupVisiblity(wizardState: WizardState, visible: boolean): WizardState {
  return Object.assign({}, wizardState, { filterPopupState: Object.assign({}, wizardState.filterPopupState, {visible})});
}

/**
 * Set if filter popup should hide when navigation elements are clicked
 * @param {WizardState} wizardState
 * @param {boolean} pinned
 * @return {WizardState}
 */
export function setFilterPopupPinned(wizardState: WizardState, pinned: boolean): WizardState {
  return Object.assign({}, wizardState, { filterPopupState: Object.assign({}, wizardState.filterPopupState, {pinned})});
}

