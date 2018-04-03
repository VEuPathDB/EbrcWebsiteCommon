import React from 'react';

import { Seq } from 'wdk-client/IterableUtils';
import {
  Dialog,
  IconAlt as Icon
} from 'wdk-client/Components';
import { wrappable } from 'wdk-client/ComponentUtils';

import { makeQuestionWizardClassName as makeClassName } from '../util/classNames';
import {
  getParameter,
  getParameterValuesForGroup,
  groupParamsValuesAreDefault
} from '../util/QuestionWizardState';

import FilterSummaryParameter from './FilterSummaryParameter';

/**
 * Show a summary of active filters
 */
class FilterSummary extends React.Component {
  render () {
    const { wizardState, eventHandlers } = this.props;

    const filterSummary = Seq.from(wizardState.question.groups)
      .filter(group => !groupParamsValuesAreDefault(wizardState, group))
      .map(group => (
        <div key={group.name} className={makeClassName('FilterSummaryGroup')}>
          <h4><Icon fa="filter" className={makeClassName('GroupFilterIcon')}/> {group.displayName}</h4>
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
              }, [[ [], [] ]])
              .map(([ fpns, others ]) => [
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
                    <br/>
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
      ));

    return (
      <Dialog
        resizable
        draggable
        className={makeClassName('FilterSummary')}
        open={wizardState.filterPopupState.visible}
        title="Active Filters"
        buttons={[
          <button
            key="pin"
            type="button"
            title="Prevent summary popup from closing when clicking on filters."
            className={makeClassName('FilterPopupTitleButton')}
            onClick={() => eventHandlers.setFilterPopupPinned(!wizardState.filterPopupState.pinned)}
          >
            <Icon fa={wizardState.filterPopupState.pinned ? 'circle' : 'thumb-tack'} />
          </button>,
          <button
            type="button"
            key="close"
            className={makeClassName('FilterPopupTitleButton')}
            onClick={() => eventHandlers.setFilterPopupVisiblity(false)}
          >
            <Icon fa="close"/>
          </button>
        ]}
      >
        <div>
          {filterSummary.isEmpty() ? (
            <p>No filters applied</p>
          ) : (
            filterSummary
          )}
          <div className={makeClassName('FilterSummaryRemoveAll')}>
            <button type="button" className="wdk-Link" onClick={() => eventHandlers.resetParamValues()}>
              Remove all
            </button>
          </div>
        </div>
      </Dialog>
    );
  }
}

export default wrappable(FilterSummary);
