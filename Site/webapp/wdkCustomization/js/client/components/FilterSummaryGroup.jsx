import React from 'react';
import { wrappable } from 'wdk-client/ComponentUtils';
import { IconAlt as Icon } from 'wdk-client/Components';

import { makeQuestionWizardClassName as makeClassName } from '../util/classNames';
import {
  getParameter,
  getParameterValuesForGroup,
  groupParamsValuesAreDefault
} from '../util/QuestionWizardState';
import FilterSummaryParameter from './FilterSummaryParameter';

function FilterSummaryGroup(props) {
  const { group, wizardState, eventHandlers } = props;

  if (groupParamsValuesAreDefault(wizardState, group)) return null;

  return (
    <div className={makeClassName('FilterSummaryGroup')}>
      <h4><Icon fa="filter" className={makeClassName('GroupFilterIcon')} /> {group.displayName}</h4>
      {groupParamsValuesAreDefault(wizardState, group)
        ? <em>No filters applied</em>
        : Object.entries(getParameterValuesForGroup(wizardState, group.name))
          .filter(([paramName]) => getParameter(wizardState, paramName).isVisible)
          // separate filter params from other params
          .reduce(([partitions], entry) => {
            const param = getParameter(wizardState, entry[0]);
            if (param.type === 'FilterParamNew') {
              partitions[0].push(entry);
            }
            else {
              partitions[1].push(entry);
            }
            return [partitions];
          }, [[[], []]])
          .map(([fpns, others]) => [
            ...(
              others.length === 0 ||
              others.every(([paramName, paramValue]) =>
                getParameter(wizardState, paramName).defaultValue === paramValue)
            ) ? []
              : [
                <div key="others" className={makeClassName('Chiclet', 'parameters')}>
                  <button
                    type="button"
                    title="Clear selection"
                    className={makeClassName('RemoveFilterButton')}
                    onClick={() =>
                      others.forEach(entry => {
                        const param = getParameter(wizardState, entry[0]);
                        eventHandlers.setParamValue(param, param.defaultValue);
                      })
                    }>
                    <Icon fa="close" />
                  </button>
                  {others.map(([paramName, paramValue]) =>
                    <FilterSummaryParameter
                      key={paramName}
                      group={group}
                      paramValue={paramValue}
                      wizardState={wizardState}
                      eventHandlers={eventHandlers}
                      parameter={getParameter(wizardState, paramName)}
                    />
                  )}
                </div>,
                <br key="br" />
              ],
            <React.Fragment key="fpns">
              {fpns.map(([paramName, paramValue]) =>
                <FilterSummaryParameter
                  key={paramName}
                  group={group}
                  paramValue={paramValue}
                  wizardState={wizardState}
                  eventHandlers={eventHandlers}
                  parameter={getParameter(wizardState, paramName)}
                />
              )}
            </React.Fragment>
          ])}
    </div>
  )
}

export default wrappable(FilterSummaryGroup);