import { every } from 'lodash';
import React from 'react';
import { Seq } from 'wdk-client/Utils/IterableUtils';
import {
  Dialog,
  IconAlt as Icon
} from 'wdk-client/Components';
import { wrappable } from 'wdk-client/Utils/ComponentUtils';

import { makeQuestionWizardClassName as makeClassName } from '../util/classNames';

import FilterSummaryGroup from './FilterSummaryGroup';

import {
  QuestionWithParameters,
  Parameter,
  ParameterGroup,
  ParameterValue,
  ParameterValues
} from 'wdk-client/Utils/WdkModel';
import { FilterField } from 'wdk-client/Components/AttributeFilter/Types';

type Props = {
  isVisible: boolean,
  isPinned: boolean,
  setVisible: (visible: boolean) => any,
  setPinned: (pinned: boolean) => any,
  parametersByName: Map<string, Parameter>,
  groupsWithNondefaultValues: ParameterGroup[],
  paramValues: ParameterValues,
  defaultParamValues: ParameterValues,
  onParamValuesReset:() => any,
  onParamValueChange: (parameter: Parameter, newParamValue: ParameterValue) => any,
  onSelectGroup: (group: ParameterGroup) => any,
  onSelectFilterParamField: (group: ParameterGroup, parameter: Parameter, field: FilterField) => any,
}

class FilterSummary extends React.Component<Props> {
  render () {
    const props = this.props;
    return (
      <Dialog
        resizable
        draggable
        className={makeClassName('FilterSummary')}
        open={props.isVisible}
        title="Active Filters"
        buttons={[
          <button
            key="pin"
            type="button"
            title="Prevent summary popup from closing when clicking on filters."
            className={makeClassName('FilterPopupTitleButton')}
            onClick={() => props.setPinned(!props.isPinned)}
          >
            <Icon fa={props.isPinned ? 'circle' : 'thumb-tack'} />
          </button>,
          <button
            type="button"
            key="close"
            className={makeClassName('FilterPopupTitleButton')}
            onClick={() => props.setVisible(false)}
          >
            <Icon fa="close"/>
          </button>
        ]}
      >
        <div>
          { props.groupsWithNondefaultValues.length === 0 ? (
            <p>No filters applied</p>
          ) : (
            props.groupsWithNondefaultValues.map(group => 
              <FilterSummaryGroup
                key={group.name}
                groupDisplayName={group.displayName}
                groupParameters={group.parameters.map(paramName => props.parametersByName.get(paramName) as Parameter)}
                paramValues={props.paramValues}
                defaultParamValues={props.defaultParamValues}
                onParamValueChange={props.onParamValueChange}
                onSelectGroup={()=>props.onSelectGroup(group)}
                onSelectFilterParamField={(parameter: Parameter, field: FilterField) => props.onSelectFilterParamField(group, parameter, field)}
                />
              )
          )}
          <div className={makeClassName('FilterSummaryRemoveAll')}>
            <button type="button" className="wdk-Link" onClick={props.onParamValuesReset}>
              Remove all
            </button>
          </div>
        </div>
      </Dialog>
    );
  }
}

export default wrappable(FilterSummary);
