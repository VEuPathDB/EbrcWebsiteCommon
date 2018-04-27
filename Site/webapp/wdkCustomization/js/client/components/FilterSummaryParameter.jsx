import React from 'react';

import { IconAlt as Icon, } from 'wdk-client/Components';
import { wrappable } from 'wdk-client/ComponentUtils';
import { getFilterValueDisplay } from 'wdk-client/AttributeFilterUtils';

import { makeQuestionWizardClassName as makeClassName } from '../util/classNames';

export default wrappable(FilterSummaryParameter);

function FilterSummaryParameter(props) {
  return props.parameter.type === 'FilterParamNew'
    ? <FilterParamSummary {...props} />
    : (
      <div className={makeClassName('ParameterSummary')}>
        <strong>
          <button type="button" className="wdk-Link" onClick={() => {
            navigateToGroup(props);
          }}>
            {props.parameter.displayName}
          </button>
        </strong> {prettyPrint(props.parameter, props.paramValue)}
      </div>
    );
}

function FilterParamSummary(props) {
  const { filters } = JSON.parse(props.paramValue);
  if (filters == null || filters.length === 0) {
    return null;
  }

  return filters.map(filter => {
    const field = props.parameter.ontology.find(field => field.term === filter.field)
    return (
      <div key={props.parameter.name + '::' + field.term} className={makeClassName('Chiclet')} >
        <button
          type="button"
          title="Clear selection"
          className={makeClassName('ChicletTitle') + ' wdk-Link'}
          onClick={() => {
            navigateToGroup(props);
            props.eventHandlers.setActiveOntologyTerm(
              props.parameter,
              filters,
              field.term
            );
          }}
        >
          {field.display}
        </button>
        &nbsp;
        <button
          type="button"
          className={makeClassName('RemoveFilterButton')}
          onClick={() => props.eventHandlers.setParamValue(props.parameter, JSON.stringify({
            filters: filters.filter(f => f !== filter)
          }))}
        >
          <Icon fa="close"/>
        </button>
        <hr/>
        <div>{getFilterValueDisplay(filter)}</div>
      </div>
    );
  });
}

function prettyPrint(param, value) {
  switch(param.type) {
    case 'DateRangeParam':
    case 'NumberRangeParam':
      return prettyPrintRange(JSON.parse(value));
    default:
      return value;
  }
}

function prettyPrintRange(range) {
  return `from ${range.min} to ${range.max}`;
}

function navigateToGroup(props) {
  props.eventHandlers.setActiveGroup(props.group);
  if (!props.wizardState.filterPopupState.pinned) {
    props.eventHandlers.setFilterPopupVisiblity(false);
  }
}
