// Wizard state utility functions

import { memoize, pick } from 'lodash';
import { getFilterFields } from 'wdk-client/Views/Question/Params/FilterParamNew/FilterParamUtils';

import {
  Parameter,
  ParameterGroup,
  QuestionWithParameters,
  RecordClass,
  ParameterValues
} from 'wdk-client/Utils/WdkModel';

import {
  ParamUIState,
  GroupUIState,
  WizardState
} from './WizardTypes'
/**
 * Create initial wizard state object
 */
export function createInitialState(question: QuestionWithParameters, recordClass: RecordClass, paramValues: ParameterValues, defaultParamValues: ParameterValues, customName: string) {

  const paramUIState = question.parameters.reduce(function(uiState: ParamUIState, param: Parameter) {
    return Object.assign(uiState, { [param.name]: createInitialParamState(param) });
  }, {});

  const groupUIState = question.groups.reduce(function(groupUIState: GroupUIState, group: ParameterGroup) {
    return Object.assign(groupUIState, {
      [group.name]: {
        accumulatedTotal: undefined,
        valid: undefined,
        loading: false
      }
    });
  }, {});

  const filterPopupState = {
    visible: false,
    pinned: false
  }

  return {
    question,
    defaultParamValues,
    paramValues,
    paramUIState,
    groupUIState,
    filterPopupState,
    recordClass,
    activeGroup: undefined,
    updatingParamName: undefined,
    submitting: undefined,
    customName: customName || ''
  };
}

export function createInitialParamState(param: Parameter) {
  switch(param.type) {
    case 'filter': {
      const filterFields = getFilterFields(param).toArray();
      const ontology = param.ontology;
      return {
        ontology: ontology,
        activeOntologyTerm: filterFields.length > 0 ? filterFields[0].term : null,
        hideFilterPanel: filterFields.length === 1,
        hideFieldPanel: filterFields.length === 1,
        fieldStates: {},
        defaultMemberFieldState: {
          sort: {
            columnKey: 'value',
            direction: 'asc',
            groupBySelected: false
          },
          searchTerm: ''
        },
        defaultRangeFieldState: {
        },
        defaultMultiFieldState: {
          // retain default ontology sort by default
          sort: undefined,
          searchTerm: ''
        }
      }
    }

    case 'single-pick-vocabulary':
      return {
        vocabulary: param.vocabulary
      };

    default:
      return {};
  }

}

/**
 * Get the default parameter values
 * @param {WizardState} wizardState
 * @return {Record<string, string>}
 */
export function getDefaultParamValues(wizardState: WizardState) {
  return wizardState.defaultParamValues;
}

/**
 * Determine if the parameters of a given group have their default value.
 * @param {WizardState} wizardState
 * @param {Group} group
 * @return {boolean}
 */
export function groupParamsValuesAreDefault(wizardState: WizardState, group: ParameterGroup) {
  const defaultValues = getDefaultParamValues(wizardState);
  return group.parameters.every(paramName =>
    wizardState.paramValues[paramName] === defaultValues[paramName]);
}

export function getGroup(wizardState: WizardState, groupName: string): ParameterGroup | undefined {
  return getGroupMap(wizardState.question).get(groupName);
}

export function getParameter(wizardState: WizardState, paramName: string) : Parameter | undefined {
  return getParamMap(wizardState.question).get(paramName);
}

/**
 * Get the set of parameters for a given group.
 */
export function getParameterValuesForGroup(wizardState: WizardState, groupName: string) {
  const group = getGroup(wizardState, groupName) as ParameterGroup;
  return pick(wizardState.paramValues, group.parameters);
}

const getGroupMap = memoize((question: QuestionWithParameters) => new Map(question.groups.map(g => [g.name, g])));
const getParamMap = memoize((question: QuestionWithParameters) => new Map(question.parameters.map(p => [p.name, p])));


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

/**
 * Update paramValues with defaults.
 * @param {WizardState} wizardState
 * @return {WizardState}
 */
export function resetParamValues(wizardState: WizardState): WizardState {
  return Object.assign({}, wizardState, {paramValues: getDefaultParamValues(wizardState)});
}
