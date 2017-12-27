import React from 'react';
import PropTypes from 'prop-types';
import { result, zip } from 'lodash';
import ActiveGroup from './ActiveGroup';
import {
  getFilterValueDisplay
} from 'wdk-client/FilterServiceUtils';
import {
  Dialog,
  IconAlt as Icon,
  Loading,
  Sticky
} from 'wdk-client/Components';
import { wrappable } from 'wdk-client/ComponentUtils';
import { Seq } from 'wdk-client/IterableUtils';
import { makeQuestionWizardClassName as makeClassName } from '../util/classNames';
import {
  getParameter,
  getParameterValuesForGroup,
  groupParamsValuesAreDefault
} from '../util/QuestionWizardState';

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
    <div className={makeClassName() + ' show-scrollbar'}>
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
      .filter(groupState => 'valid' in groupState))
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
              .filter(([paramName, paramValue]) => getParameter(wizardState, paramName).defaultValue !== paramValue)
              .map(([paramName, paramValue]) =>
                getParamSummaryElements({
                  group,
                  paramValue,
                  wizardState: wizardState,
                  eventHandlers: eventHandlers,
                  parameter: getParameter(wizardState, paramName),
                }))}
        </div>
      ));

    return (
      <Dialog
        resizable
        draggable
        className={makeClassName('FilterSummary')}
        open={wizardState.filterPopupState.visible}
        title="Active Filters"
        className={makeClassName('FilterSummary')}
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

FilterSummary.propTypes = propTypes;

function getParamSummaryElements(data) {
  return data.parameter.type === 'FilterParamNew' ? getFilterParamSummaryElements(data)
    : [
      <div key={data.parameter.name} className={makeClassName('Chicklet')} title={data.paramValue}>
        <a
          href={'#' + data.parameter.name}
          onClick={e => {
            e.preventDefault();
            data.eventHandlers.setActiveGroup(data.group);
            if (!data.wizardState.filterPopupState.pinned) {
              data.eventHandlers.setFilterPopupVisiblity(false);
            }
          }}
        >
          {data.parameter.displayName}
        </a>
        &nbsp;
        <button
          type="button"
          className={makeClassName('RemoveFilterButton')}
          onClick={() => data.eventHandlers.setParamValue(data.parameter, data.parameter.defaultValue)}
        ><Icon fa="close"/></button>
      </div>
    ];
}

function getFilterParamSummaryElements(data) {
  const { filters } = JSON.parse(data.paramValue);
  if (filters == null) return null;

  return filters.map(filter => {
    const field = data.parameter.ontology.find(field => field.term === filter.field)
    return (
      <div key={data.parameter.name + '::' + field.term} className={makeClassName('Chicklet')} title={getFilterValueDisplay(field, filter)}>
        <a
          href={'#' + field.term}
          onClick={e => {
            e.preventDefault();
            data.eventHandlers.setActiveGroup(data.group);
            data.eventHandlers.setActiveOntologyTerm(
              data.parameter,
              filters,
              field.term
            );
            if (!data.wizardState.filterPopupState.pinned) {
              data.eventHandlers.setFilterPopupVisiblity(false);
            }
          }}
        >
          {field.display}
        </a>
        &nbsp;
        <button
          type="button"
          className={makeClassName('RemoveFilterButton')}
          onClick={() => data.eventHandlers.setParamValue(data.parameter, JSON.stringify({
            filters: filters.filter(f => f !== filter)
          }))}
        >
          <Icon fa="close"/>
        </button>
      </div>
    );
  });
}
