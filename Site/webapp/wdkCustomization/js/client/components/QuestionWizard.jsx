import React from 'react';
import PropTypes from 'prop-types';
import { result, zip } from 'lodash';
import ActiveGroup from './ActiveGroup';
import {
  IconAlt as Icon,
  Loading,
  Sticky
} from 'wdk-client/Components';
import { wrappable } from 'wdk-client/ComponentUtils';
import { Seq } from 'wdk-client/IterableUtils';
import { makeQuestionWizardClassName as makeClassName } from '../util/classNames';
import {
  groupParamsValuesAreDefault
} from '../util/QuestionWizardState';

import FilterSummary from './FilterSummary';

/**
 * QuestionWizard component
 */
function QuestionWizard(props) {
  const {
    question,
    paramValues,
    activeGroup
  } = props.wizardState;

  return (
    <div className={makeClassName()}>
      <div className={makeClassName('HeadingContainer')}>
        <h1 className={makeClassName('Heading')}>
          {question.displayName} &nbsp;
          {question.groups.some(groupName => !groupParamsValuesAreDefault(props.wizardState, groupName)) && (
            <button
              type="button"
              title="View a summary of active filters"
              className="wdk-Link"
              onClick={() => props.eventHandlers.setFilterPopupVisiblity(!props.wizardState.filterPopupState.visible)}
            >
              <Icon fa="filter" className={makeClassName('GroupFilterIcon')}/>
            </button>
          )}
        </h1>
        <FilterSummary {...props} />
      </div>
      <Navigation {...props} />
      {activeGroup == null ? (
        <div className={makeClassName('ActiveGroupContainer')}>
          <p className={makeClassName('HelpText')}>
            {question.summary}
          </p>
        </div>
      ) : (
        <ActiveGroup {...props} />
      )}
      <input type="hidden" name="questionFullName" value={question.name}/>
      <input type="hidden" name="questionSubmit" value="Get Answer"/>
      {question.parameters.map(param => (
        <input key={param.name} type="hidden" name={`value(${param.name})`} value={paramValues[param.name]}/>
      ))}
    </div>
  )
}

const wizardPropTypes = {
  question: PropTypes.object.isRequired,
  paramValues: PropTypes.object.isRequired,
  paramUIState: PropTypes.object.isRequired,
  groupUIState: PropTypes.object.isRequired,
  recordClass: PropTypes.object.isRequired,
  activeGroup: PropTypes.object,
  initialCount: PropTypes.number
};

const eventHandlerPropTypes = {
  setActiveGroup: PropTypes.func.isRequired,
  setActiveOntologyTerm: PropTypes.func.isRequired,
  setOntologyTermSort: PropTypes.func.isRequired,
  setOntologyTermSearch: PropTypes.func.isRequired,
  setParamValue: PropTypes.func.isRequired,
  updateInvalidGroupCounts: PropTypes.func.isRequired,
  setFilterPopupVisiblity: PropTypes.func.isRequired,
  setFilterPopupPinned: PropTypes.func.isRequired
}

export const propTypes = QuestionWizard.propTypes = {
  customName: PropTypes.string,
  isAddingStep: PropTypes.bool.isRequired,
  showHelpText: PropTypes.bool.isRequired,
  wizardState: PropTypes.shape(wizardPropTypes).isRequired,
  eventHandlers: PropTypes.shape(eventHandlerPropTypes)
};

export default wrappable(QuestionWizard);


/**
 * GroupList component
 */
function Navigation(props) {
  const {
    wizardState: {
      activeGroup,
      question,
      groupUIState,
      recordClass,
      initialCount
    },
    eventHandlers: {
      setActiveGroup,
      updateInvalidGroupCounts,
      setFilterPopupVisiblity
    },
    customName,
    showHelpText,
    isAddingStep
  } = props;
  const { groups } = question;
  const invalid = Object.values(groupUIState).some(uiState => uiState.valid === false && uiState.loading !== true);

  const finalCountState = Seq.of({ accumulatedTotal: initialCount })
    .concat(Seq.from(groups)
      .map(group => groupUIState[group.name])
      .filter(groupState => groupState.valid !== undefined))
    .last();

  // A Map from a group to its previous group
  const prevGroupMap = new Map(zip(groups.slice(1), groups.slice(0, -1)));

  // XXX We should probably have a separate component for RecordClassIcon to encapsulate this logic
  const iconName = recordClass.iconName || 'database';

  return (
    <Sticky>
      {({isFixed}) => (
          <div className={makeClassName('NavigationContainer', isFixed && 'fixed')}>
            <div className={makeClassName('NavigationIconContainer')}>
              <button
                type="button"
                title="See search overview"
                className={makeClassName('IconButton')}
                onClick={() => setActiveGroup(null)}
              >
                <Icon fa={iconName} className={makeClassName('Icon')}/>
              </button>
            </div>
            <div className={makeClassName('ParamGroupSeparator')}>
              <div className={makeClassName('ParamGroupArrow')}/>
              <ParamGroupCount
                title={`All ${recordClass.displayNamePlural}`}
                count={initialCount}
                isActive={activeGroup == groups[0]}
              />
            </div>

            {Seq.from(groups).flatMap(group => [(
              <div
                key={group.name}
                className={makeClassName('ParamGroup', group === activeGroup && 'active')}
              >
                <button
                  type="button"
                  title={`Filter ${recordClass.displayNamePlural} by ${group.displayName}`}
                  className={makeClassName(
                    'ParamGroupButton',
                    group == activeGroup && 'active'
                  )}
                  onClick={() => setActiveGroup(group)}
                >
                  {group.displayName}
                </button>
                {groupParamsValuesAreDefault(props.wizardState, group) || (
                  <button
                    type="button"
                    title="View a summary of active filters"
                    className={makeClassName('GroupFilterIconButton') + ' wdk-Link'}
                    onClick={() => setFilterPopupVisiblity(!props.wizardState.filterPopupState.visible)}
                  >
                    <Icon
                      fa="filter"
                      className={makeClassName('GroupFilterIcon')}
                    />
                  </button>
                )}
                {showHelpText && activeGroup == null && group === groups[0] && (
                  <div className={makeClassName('GetStarted')}>
                    Click to get started. <em>(skipping ahead is ok)</em>
                  </div>
                )}
              </div>
            ), group !== groups[groups.length - 1] && (
              <div key={group.name + '__sep'} className={makeClassName('ParamGroupSeparator')}>
                <div className={makeClassName('ParamGroupArrow')}/>
                <ParamGroupCount
                  title={`${recordClass.displayNamePlural} selected from previous steps.`}
                  count={groupUIState[group.name].accumulatedTotal}
                  isLoading={groupUIState[group.name].loading}
                  isValid={groupUIState[group.name].valid}
                  isActive={(group === activeGroup || group === prevGroupMap.get(activeGroup))}
                />
              </div>
            )])}
            <div className={makeClassName('SubmitContainer')}>
              <button
                className={makeClassName('SubmitButton')}
                title="View the results of your search for further analysis."
              >
                { finalCountState.accumulatedTotal == null || finalCountState.loading ? <Loading radius={4} className={makeClassName('ParamGroupCountLoading')}/>
                : finalCountState.valid === false ? `View ? ${recordClass.displayNamePlural}`
                : `${isAddingStep ? 'Combine' : 'View'} ${result(finalCountState.accumulatedTotal, 'toLocaleString')} ${recordClass.displayNamePlural}` }
              </button>
              <input className={makeClassName('CustomNameInput')} defaultValue={customName} type="text" name="customName" placeholder="Name this search"/>
            </div>
            {invalid && (
              <div className={makeClassName('InvalidCounts')}>
                <button
                  type="button"
                  className="wdk-Link"
                  onClick={updateInvalidGroupCounts}
                  title="Recompute invalid counts above"
                >
                  <Icon fa="refresh"/> Refresh counts
                </button>
              </div>
            )}
          </div>
      )}
    </Sticky>
  )
}

Navigation.propTypes = QuestionWizard.propTypes;

/** Render count or loading */
function ParamGroupCount(props) {
  return (
    <div title={props.title}
      className={makeClassName(
        'ParamGroupCount',
        props.isValid === false && 'invalid',
        props.isActive && 'active'
      )}
    >
      {props.isLoading === true ? (
        <Loading radius={2} className={makeClassName('ParamGroupCountLoading')}/>
      ) : (props.isValid === false ? '?' : result(props.count, 'toLocaleString'))}
    </div>
  )
}

ParamGroupCount.propTypes = {
  title: PropTypes.string,
  count: PropTypes.number,
  isValid: PropTypes.bool,
  isLoading: PropTypes.bool,
  isActive: PropTypes.bool
};
