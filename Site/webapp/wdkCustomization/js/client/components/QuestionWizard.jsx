import React from 'react';
import PropTypes from 'prop-types';
import { zip } from 'lodash';
import ActiveGroup from './ActiveGroup';
import { Icon, Loading, Sticky } from 'wdk-client/Components';
import { wrappable } from 'wdk-client/ComponentUtils';
import { Seq } from 'wdk-client/IterableUtils';
import { makeQuestionWizardClassName as makeClassName } from '../util/classNames';

/**
 * QuestionWizard component
 */
function QuestionWizard(props) {
  const {
    question,
    paramValues,
    activeGroup
  } = props;

  return (
    <div className={makeClassName() + ' show-scrollbar'}>
      <div className={makeClassName('HeadingContainer')}>
        <h1 className={makeClassName('Heading')}>{question.displayName}</h1>
        {/* FIXME Remove when we get this from the model */}
        <div className={makeClassName('HackyStudyLink')}>
          <i className="fa fa-info-circle" aria-hidden="true"></i> Learn about the <a href="/a/app/record/dataset/DS_61ac5d073c" target="_blank">MAL-ED Study</a>
        </div>
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

export const propTypes = QuestionWizard.propTypes = {
  question: PropTypes.object.isRequired,
  customName: PropTypes.string,
  showHelpText: PropTypes.bool.isRequired,
  isAddingStep: PropTypes.bool.isRequired,
  paramValues: PropTypes.object.isRequired,
  paramUIState: PropTypes.object.isRequired,
  groupUIState: PropTypes.object.isRequired,
  recordClass: PropTypes.object.isRequired,
  activeGroup: PropTypes.object,
  initialCount: PropTypes.number,
  onActiveGroupChange: PropTypes.func.isRequired,
  onActiveOntologyTermChange: PropTypes.func.isRequired,
  onParamValueChange: PropTypes.func.isRequired,
  onUpdateInvalidGroupCounts: PropTypes.func.isRequired
};

export default wrappable(QuestionWizard);


/**
 * GroupList component
 */
function Navigation(props) {
  const {
    activeGroup,
    question,
    customName,
    showHelpText,
    isAddingStep,
    groupUIState,
    recordClass,
    initialCount,
    onActiveGroupChange,
    onUpdateInvalidGroupCounts
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

  return (
    <Sticky
      className={makeClassName('NavigationContainer')}
      fixedClassName={makeClassName('NavigationContainer', 'fixed')}
    >
      <div className={makeClassName('NavigationIconContainer')}>
        <button
          type="button"
          title="See search overview"
          className={makeClassName('Icon', recordClass.name)}
          onClick={() => onActiveGroupChange(null)}
        />
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
            onClick={() => onActiveGroupChange(group)}
          >
            {group.displayName}
          </button>
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
          : `${isAddingStep ? 'Combine' : 'View'} ${finalCountState.accumulatedTotal} ${recordClass.displayNamePlural}` }
        </button>
        <input className={makeClassName('CustomNameInput')} defaultValue={customName} type="text" name="customName" placeholder="Name this search"/>
      </div>
      {invalid && (
        <div className={makeClassName('InvalidCounts')}>
          <button
            type="button"
            className="wdk-Link"
            onClick={onUpdateInvalidGroupCounts}
            title="Recompute invalid counts above"
          >
            <Icon className="fa fa-refresh"/> Refresh counts
          </button>
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
      ) : (props.isValid === false ? '?' : props.count)}
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
