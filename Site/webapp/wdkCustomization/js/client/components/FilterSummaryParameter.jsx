import React from 'react';

import { IconAlt as Icon, } from 'wdk-client/Components';
import { wrappable } from 'wdk-client/ComponentUtils';
import { Seq } from 'wdk-client/IterableUtils';
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

  return (
    <div className="filter-param">
      <ul className="filter-items" style={{ fontSize: '1em' }}>
        {Seq.from(filters)
          .map(filter => {
            if (filter.type === 'multiFilter') {
              const field = props.parameter.ontology.find(field => field.term === filter.field);
              return (
                <li className="multiFilter">
                  <sup className="multiFilter-operation">{filter.value.operation === 'union' ? 'Any' : 'All'} of these {field.display}</sup>
                  <ul className="filter-items">
                    {filter.value.filters.map(leafFilter => (
                      <li>
                        <FilterParamFilter filter={leafFilter} containerFilter={filter} filters={filters} {...props} />
                      </li>
                    ))}
                  </ul>
                </li>
              );
            }
            return (
              <li>
                <FilterParamFilter filter={filter} filters={filters} {...props} />
              </li>
            );
          })}
      </ul>
    </div>
  );
}

function FilterParamFilter(props) {
  const { containerFilter, eventHandlers, filter, filters, parameter } = props;
  const field = parameter.ontology.find(field => field.term === filter.field)
  return (
    <div key={parameter.name + '::' + field.term} className={makeClassName('Chiclet')} >
      <button
        type="button"
        title="Clear selection"
        className={makeClassName('ChicletTitle') + ' wdk-Link'}
        onClick={() => {
          navigateToGroup(props);
          eventHandlers.setActiveOntologyTerm(
            parameter,
            filters,
            containerFilter ? containerFilter.field : filter.field
          );
        }}
      >
        {field.display}
      </button>
      &nbsp;
      <button
        type="button"
        className={makeClassName('RemoveFilterButton')}
        onClick={() => eventHandlers.setParamValue(props.parameter, JSON.stringify({
          filters: containerFilter
            ? filters.map(f => f === containerFilter
              ? { ...f, value: { ...f.value, filters: f.value.filters.filter(cf => cf !== filter) } }
              : f
            )
            : filters.filter(f => f !== filter)
        }))}
      >
        <Icon fa="close"/>
      </button>
      <hr/>
      <div>{getFilterValueDisplay(filter)}</div>
    </div>
  );
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
