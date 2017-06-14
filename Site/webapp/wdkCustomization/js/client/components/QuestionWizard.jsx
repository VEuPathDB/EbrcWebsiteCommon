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
    customName,
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
  return (
    <div className={makeClassName()}>
      <h1 className={makeClassName('Heading')}>{question.displayName}</h1>
      <Navigation
        customName={customName}
        totalCount={totalCount}
        activeGroup={activeGroup}
        groups={question.groups}
        groupUIState={groupUIState}
        onGroupSelect={onActiveGroupChange}
        recordClass={recordClass}
      />
      {activeGroup == null ? (
        <div className={makeClassName('ActiveGroupContainer')}>
          <p className={makeClassName('HelpText')}>
            {question.summary}
          </p>
        </div>
      ) : (
        <div className={makeClassName('ActiveGroupContainer')}>
          <h3>{groupUIState[activeGroup.name].accumulatedTotal} {recordClass.displayNamePlural} selected</h3>
          <p>{activeGroup.description}</p>
          <div className={makeClassName('ParamContainer')}>
            {activeGroup.parameters.map(paramName => {
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
                      param={param}
                      value={paramValues[param.name]}
                      uiState={paramUIState[param.name]}
                      onActiveOntologyTermChange={onActiveOntologyTermChange}
                      onParamValueChange={onParamValueChange}
                    />
                  </div>
                  {/*
                  <div className={makeClassName('ParamDescription')}>
                    {param.help}
                  </div>
                  */}
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
function Navigation(props) {
  const { activeGroup, customName, groups, groupUIState, onGroupSelect, recordClass, totalCount } = props;
  const finalCount = Seq.of(totalCount)
    .concat(groups.map(group => groupUIState[group.name].accumulatedTotal))
    .filter(finalCount => finalCount != null)
    .last();
  return (
    <Sticky
      className={makeClassName('NavigationContainer')}
      fixedClassName={makeClassName('NavigationContainer', 'fixed')}
    >
      <div className={makeClassName('NavigationIconContainer')}>
        <i className={makeClassName('Icon', recordClass.name)}/>
        <div className={makeClassName('TotalCount')}>
          {totalCount}
        </div>
      </div>
      <div className={makeClassName('ParamGroupSeparator')}>
        <div className={makeClassName('ParamGroupArrow')}/>
      </div>

      {Seq.from(groups).flatMap(group => [(
        <div className={makeClassName('ParamGroup')} key={group.name}>
          <button
            type="button"
            title={`Filter ${recordClass.displayNamePlural} by ${group.displayName}`}
            className={makeClassName(
              'ParamGroupButton',
              group == activeGroup ? 'active' : '',
              groupUIState[group.name].accumulatedTotal != null ?  'configured' : ''
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
        <div className={makeClassName('ParamGroupSeparator')}>
          <div className={makeClassName('ParamGroupArrow')}/>
          {groupUIState[group.name].configured && (
            <ParamGroupCount
              title={`${groupUIState[group.name].accumulatedTotal} ${recordClass.displayNamePlural} selected from previous step.`}
              count={groupUIState[group.name].accumulatedTotal}
            />
          )}
        </div>
      )])}
      <div className={makeClassName('SubmitContainer')}>
        <button className={makeClassName('SubmitButton')} >
          {finalCount == null || finalCount === 'loading'
              ? <Loading radius={4} className={makeClassName('ParamGroupCountLoading')}/>
              : `View ${finalCount} ${recordClass.displayNamePlural}`}
        </button>
        <input className={makeClassName('CustomNameInput')} defaultValue={customName} type="text" name="customName" placeholder="Name this search"/>
      </div>
    </Sticky>
  )
}

Navigation.propTypes = {
  activeGroup: React.PropTypes.string,
  groups: React.PropTypes.array.isRequired,
  groupUIState: React.PropTypes.object.isRequired,
  onGroupSelect: React.PropTypes.func.isRequired,
  recordClass: React.PropTypes.object.isRequired,
  totalCount: React.PropTypes.number
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

function ParamGroupCount(props) {
  return (
    <div className={makeClassName('ParamGroupCount')}>
      {props.count === 'loading' ? (
        <Loading radius={2} className={makeClassName('ParamGroupCountLoading')}/>
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

function makeClassName(element = '', ...modifiers) {
  const className = 'ebrc-QuestionWizard' + element;
  const modifiedClassNames = modifiers.map(function(modifier) {
    return ' ' + className + '__' + modifier;
  }).join('');

  return className + modifiedClassNames;
}
