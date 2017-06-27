import 'eupathdb/wdkCustomization/css/question-wizard.css';
import React from 'react';
import PropTypes from 'prop-types';
import FilterParamNew from './FilterParamNew';
import FlatVocabParam from './FlatVocabParam';
import StringParam from './StringParam';
import { Icon, Loading, Sticky } from 'wdk-client/Components';
import { Seq } from 'wdk-client/IterableUtils';

/**
 * QuestionWizard component
 */
export default function QuestionWizard(props) {
  const {
    question,
    customName,
    paramValues,
    paramUIState,
    groupUIState,
    recordClass,
    activeGroup,
    totalCount,
    finalCount,
    onActiveGroupChange,
    onActiveOntologyTermChange,
    onParamValueChange,
    onUpdateInvalidGroupCounts
  } = props;

  const accumulatedTotal = activeGroup && groupUIState[activeGroup.name].accumulatedTotal;
  return (
    <div className={makeClassName()}>
      <h1 className={makeClassName('Heading')}>{question.displayName}</h1>
      <Navigation
        customName={customName}
        totalCount={totalCount}
        finalCount={finalCount}
        activeGroup={activeGroup}
        groups={question.groups}
        groupUIState={groupUIState}
        onGroupSelect={onActiveGroupChange}
        recordClass={recordClass}
        onUpdateInvalidGroupCounts={onUpdateInvalidGroupCounts}
      />
      {activeGroup == null ? (
        <div className={makeClassName('ActiveGroupContainer')}>
          <p className={makeClassName('HelpText')}>
            {question.summary}
          </p>
        </div>
      ) : (
        <div className={makeClassName('ActiveGroupContainer')}>
          <div className={makeClassName('ActiveGroupCount')}>
            {
              accumulatedTotal != null && accumulatedTotal !== 'loading' ?  accumulatedTotal
                : <Loading radius={2} className={makeClassName('GroupLoading')}/>
            } of {totalCount} {recordClass.displayNamePlural} selected
          </div>
          <p>{activeGroup.description}</p>
          <div
            className={makeClassName('ParamContainer')}
            onKeyPress={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
              }
            }}
          >
            {activeGroup.parameters.map((paramName, index) => {
              const param = question.parameters.find(p => p.name === paramName);
              const ParamComponent = findParamComponent(param);
              return (
                <div key={paramName} className={makeClassName('Param')}>
                  {activeGroup.parameters.length > 1 && (
                    <div className={makeClassName('ParamLabel')}>
                      <label>{param.displayName}</label>
                    </div>
                  )}
                  <div className={makeClassName('ParamControl')}>
                    <ParamComponent
                      autoFocus={index === 0}
                      param={param}
                      value={paramValues[param.name]}
                      uiState={paramUIState[param.name]}
                      onActiveOntologyTermChange={onActiveOntologyTermChange}
                      onParamValueChange={onParamValueChange}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <input type="hidden" name="questionFullName" value={question.name}/>
      <input type="hidden" name="questionSubmit" value="Get Answer"/>
      {question.parameters.map(param => (
        <input key={param.name} type="hidden" name={`value(${param.name})`} value={paramValues[param.name]}/>
      ))}
    </div>
  )
}

QuestionWizard.propTypes = {
  question: PropTypes.object.isRequired,
  customName: PropTypes.string,
  paramValues: PropTypes.object.isRequired,
  paramUIState: PropTypes.object.isRequired,
  groupUIState: PropTypes.object.isRequired,
  recordClass: PropTypes.object.isRequired,
  activeGroup: PropTypes.object,
  totalCount: PropTypes.number,
  finalCount: PropTypes.number,
  onActiveGroupChange: PropTypes.func.isRequired,
  onActiveOntologyTermChange: PropTypes.func.isRequired,
  onParamValueChange: PropTypes.func.isRequired,
  onUpdateInvalidGroupCounts: PropTypes.func.isRequired
};

export const paramPropTypes = {
  param: PropTypes.object.isRequired,
  value: PropTypes.string.isRequired,
  uiState: PropTypes.object.isRequired,
  onActiveOntologyTermChange: PropTypes.func.isRequired,
  onParamValueChange: PropTypes.func.isRequired,
  autoFocus: PropTypes.bool
}

/**
 * GroupList component
 */
function Navigation(props) {
  const {
    activeGroup,
    customName,
    groups,
    groupUIState,
    onGroupSelect,
    recordClass,
    totalCount,
    finalCount,
    onUpdateInvalidGroupCounts
  } = props;
  const invalid = Object.values(groupUIState).some(uiState => uiState.valid === false);
  return (
    <Sticky
      className={makeClassName('NavigationContainer')}
      fixedClassName={makeClassName('NavigationContainer', 'fixed')}
    >
      <div className={makeClassName('NavigationIconContainer')}>
        <i className={makeClassName('Icon', recordClass.name)}/>
      </div>
      <div className={makeClassName('ParamGroupSeparator')}>
        <div className={makeClassName('ParamGroupArrow')}/>
        <ParamGroupCount title={`All ${recordClass.displayNamePlural}`} count={totalCount}/>
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
            onClick={() => onGroupSelect(group)}
          >
            {group.displayName}
          </button>
          {activeGroup == null && group === groups[0] && (
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
            isValid={groupUIState[group.name].valid}
          />
        </div>
      )])}
      <div className={makeClassName('SubmitContainer')}>
        <button
          className={makeClassName('SubmitButton')}
          title="View the results of your search for further analysis."
        >
          {finalCount == null || finalCount === 'loading'
              ? <Loading radius={4} className={makeClassName('ParamGroupCountLoading')}/>
              : `View ${finalCount} ${recordClass.displayNamePlural}`}
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

Navigation.propTypes = {
  activeGroup: PropTypes.object,
  groups: PropTypes.array.isRequired,
  groupUIState: PropTypes.object.isRequired,
  onGroupSelect: PropTypes.func.isRequired,
  recordClass: PropTypes.object.isRequired,
  totalCount: PropTypes.number,
  finalCount: PropTypes.number,
  customName: PropTypes.string,
  onUpdateInvalidGroupCounts: PropTypes.func.isRequired
};

/**
 * Param component
 */
function Param(props) {
  return (
    <div className={makeClassName('Param')}>
      {props.param.displayName} {props.param.defaultValue}
    </div>
  )
}

Param.propTypes = paramPropTypes;

/** Render count or loading */
function ParamGroupCount(props) {
  return (
    <div title={props.title} className={makeClassName('ParamGroupCount', props.isValid === false && 'invalid')}>
      {props.count === 'loading' ? (
        <Loading radius={2} className={makeClassName('ParamGroupCountLoading')}/>
      ) : (props.isValid === false ? '?' : props.count)}
    </div>
  )
}

ParamGroupCount.propTypes = {
  title: PropTypes.string,
  count: PropTypes.oneOfType([ PropTypes.oneOf([ 'loading' ]), PropTypes.number ]),
  isValid: PropTypes.bool
};

/**
 * Lookup Param component by param type
 */
function findParamComponent(param) {
  switch(param.type) {
    case 'FilterParamNew': return FilterParamNew;
    case 'StringParam': return StringParam;
    case 'FlatVocabParam': return FlatVocabParam;
    default: return Param;
  }
}

/**
 * Make a className string
 */
function makeClassName(element = '', ...modifiers) {
  const className = 'ebrc-QuestionWizard' + element;
  const modifiedClassNames = modifiers.filter(modifier => modifier).map(function(modifier) {
    return ' ' + className + '__' + modifier;
  }).join('');

  return className + modifiedClassNames;
}
