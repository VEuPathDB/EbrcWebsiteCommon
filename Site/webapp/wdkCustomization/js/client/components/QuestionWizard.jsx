import 'eupathdb/wdkCustomization/css/question-wizard.css';
import React from 'react';
import FilterParamNew from './FilterParamNew';
import FlatVocabParam from './FlatVocabParam';
import StringParam from './StringParam';
import { Loading, Sticky } from 'wdk-client/Components';
import { Seq } from 'wdk-client/IterableUtils';

/**
 * QuestionWizard component
 */
export default function QuestionWizard(props) {
  const {
    question,
    paramValues,
    paramUIState,
    groupUIState,
    recordClass,
    activeGroup,
    totalCount,
    onActiveGroupChange,
    onActiveOntologyTermChange,
    onParamValueChange
  } = props;
  const finalCount = Seq.from(Object.values(groupUIState))
    .map(state => state.accumulatedTotal)
    .takeWhile(accumulatedTotal => accumulatedTotal != null)
    .last();
  return (
    <div className="ebrc-QuestionWizard">
      <h1 className="ebrc-QuestionWizardHeading">{question.displayName}</h1>
      <Sticky
        className="ebrc-QuestionWizardNavigationContainer"
        fixedClassName="ebrc-QuestionWizardNavigationContainer__fixed"
      >
        <div>
          <i className={'ebrc-QuestionWizardIcon ebrc-QuestionWizardIcon__' + recordClass.name}/>
          <div className="ebrc-QuestionWizardParamGroupCount">
            {totalCount}
          </div>
        </div>
        <GroupList
          activeGroup={activeGroup}
          groups={question.groups}
          groupUIState={groupUIState}
          onGroupSelect={onActiveGroupChange}
          recordClass={recordClass}
        />
        <div className="ebrc-QuestionWizardParamGroup">
          <i className={'ebrc-QuestionWizardIcon ebrc-QuestionWizardIcon__' + recordClass.name}/>
          <ParamGroupCount count={finalCount == null ? totalCount : finalCount}/>
        </div>
        <div>
          <button className="ebrc-QuestionWizardSubmitButton" >Done</button>
        </div>
      </Sticky>
      {activeGroup == null ? (
        <div className="ebrc-QuestionWizardActiveGroupContainer">
          <div className="ebrc-QuestionWizardGetStarted">
            Click to get started. <em>(skipping ahead is ok)</em>
          </div>
          <p className="ebrc-QuestionWizardHelpText">
            {question.summary}
          </p>
        </div>
      ) : (
        <div className="ebrc-QuestionWizardActiveGroupContainer">
          <p>{activeGroup.description}</p>
          <div>
            {activeGroup.parameters.map(paramName => {
              const param = question.parameters.find(p => p.name === paramName);
              const ParamComponent = findParamComponent(param);
              return (
                <div key={paramName}>
                  <label>{param.displayName}</label>
                  <ParamComponent
                    param={param}
                    value={paramValues[param.name]}
                    uiState={paramUIState[param.name]}
                    onActiveOntologyTermChange={onActiveOntologyTermChange}
                    onParamValueChange={onParamValueChange}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
      <input type="hidden" name="questionFullName" value={question.name}/>
      <input type="hidden" name="questionSubmit" value="Get Answer"/>
      {question.parameters.map(param => (
        <input type="hidden" name={`value(${param.name})`} value={paramValues[param.name]}/>
      ))}
    </div>
  )
}

QuestionWizard.propTypes = {
  question: React.PropTypes.object.isRequired,
  paramValues: React.PropTypes.object.isRequired,
  paramUIState: React.PropTypes.object.isRequired,
  groupUIState: React.PropTypes.object.isRequired,
  recordClass: React.PropTypes.object.isRequired,
  activeGroup: React.PropTypes.string.isRequired,
  totalCount: React.PropTypes.number,
  onActiveGroupChange: React.PropTypes.func.isRequired,
  onActiveOntologyTermChange: React.PropTypes.func.isRequired,
  onParamValueChange: React.PropTypes.func.isRequired
};

export const paramPropTypes = {
  param: React.PropTypes.object.isRequired,
  value: React.PropTypes.string.isRequired,
  uiState: React.PropTypes.object.isRequired,
  onActiveOntologyTermChange: React.PropTypes.func.isRequired,
  onParamValueChange: React.PropTypes.func.isRequired
}

/**
 * GroupList component
 */
function GroupList(props) {
  const { activeGroup, groups, groupUIState, onGroupSelect, recordClass } = props;
  return (
    <div className="ebrc-QuestionWizardParamGroupContainer">
      {groups.map(group => (
        <div className="ebrc-QuestionWizardParamGroup" key={group.name}>
          <button
            type="button"
            title={`Filter ${recordClass.displayNamePlural} by ${group.displayName}`}
            className={'ebrc-QuestionWizardParamGroupButton' +
                (group == activeGroup ?
                  ' ebrc-QuestionWizardParamGroupButton__active' : '') +
                (groupUIState[group.name].accumulatedTotal != null ?
                  ' ebrc-QuestionWizardParamGroupButton__configured' : '')}
            onClick={() => onGroupSelect(group)}
          >
            {group.displayName}
          </button>
          <ParamGroupCount count={groupUIState[group.name].accumulatedTotal}/>
        </div>
      ))}
    </div>
  )
}

GroupList.propTypes = {
  activeGroup: React.PropTypes.string,
  groups: React.PropTypes.array.isRequired,
  groupUIState: React.PropTypes.object.isRequired,
  onGroupSelect: React.PropTypes.func.isRequired,
  recordClass: React.PropTypes.object.isRequired
};

/**
 * Param component
 */
function Param(props) {
  return (
    <div className="ebrc-QuestionWizardParam">
      {props.param.displayName} {props.param.defaultValue}
    </div>
  )
}

Param.propTypes = paramPropTypes;

function ParamGroupCount(props) {
  return (
    <div className="ebrc-QuestionWizardParamGroupCount">
      {props.count === 'loading' ? (
        <Loading radius={2} className="ebrc-QuestionWizardParamGroupCountLoading"/>
      ) : props.count}
    </div>
  )
}

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
