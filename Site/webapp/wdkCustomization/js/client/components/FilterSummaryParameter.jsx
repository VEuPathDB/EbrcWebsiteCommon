import React from 'react';

import { IconAlt as Icon, } from 'wdk-client/Components';
import { wrappable } from 'wdk-client/ComponentUtils';
import { getFilterValueDisplay } from 'wdk-client/FilterServiceUtils';

import { makeQuestionWizardClassName as makeClassName } from '../util/classNames';

export default wrappable(FilterSummaryParameter);

function FilterSummaryParameter(props) {
  return props.parameter.type === 'FilterParamNew'
    ? <FilterParamSummary {...props} />
    : (
      <div className={makeClassName('ParameterSummary')}>
        <strong>{props.parameter.displayName}</strong>
        &nbsp;
        {prettyPrint(props.parameter, props.paramValue)}
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
      <div key={props.parameter.name + '::' + field.term} className={makeClassName('Chicklet')} >
        <a
          href={'#' + field.term}
          onClick={e => {
            e.preventDefault();
            props.eventHandlers.setActiveGroup(props.group);
            props.eventHandlers.setActiveOntologyTerm(
              props.parameter,
              filters,
              field.term
            );
            if (!props.wizardState.filterPopupState.pinned) {
              props.eventHandlers.setFilterPopupVisiblity(false);
            }
          }}
        >
          {field.display}
        </a>
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
        <small>{getFilterValueDisplay(field, filter)}</small>
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
