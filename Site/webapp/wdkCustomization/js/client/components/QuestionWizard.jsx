import React from 'react';
import FilterParamNew from './FilterParamNew';

export default function QuestionWizard(props) {
  const {
    question,
    paramValues,
    paramUIState,
    recordClass,
    activeGroup,
    onActiveGroupChange,
    onActiveOntologyTermChange,
    onParamValueChange
  } = props;
  return (
    <div>
      <h1>{recordClass.displayName} by {question.displayName}</h1>
      <p>{question.summary}</p>
      <GroupList
        groups={question.groups}
        onGroupSelect={onActiveGroupChange}
      />
      <div>
        {activeGroup == null ? (
          <div>Select a group above to get started</div>
        ) : (
          <div>
            <p>{activeGroup.description}</p>
            <ul>
              {activeGroup.parameters.map(paramName => {
                const param = question.parameters.find(p => p.name === paramName);
                const ParamComponent = findParamComponent(param);
                return (
                  <li key={paramName}>
                    <ParamComponent
                      param={param}
                      value={paramValues[param.name]}
                      uiState={paramUIState[param.name]}
                      onActiveOntologyTermChange={onActiveOntologyTermChange}
                      onParamValueChange={onParamValueChange}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function GroupList(props) {
  return (
    <ul>
      {props.groups.map(group => (
        <li className="ebrc-QuestionWizardParamGroup" key={group.name}>
          <button type="button" onClick={() => props.onGroupSelect(group)}>
            {group.displayName}
          </button>
        </li>
      ))}
    </ul>
  )
}

function Param(props) {
  return (
    <div className="ebrc-QuestionWizardParam">
      {props.param.displayName} {props.param.defaultValue}
    </div>
  )
}

function findParamComponent(param) {
  if (param.type === 'FilterParamNew') {
    return FilterParamNew;
  }
  return Param;
}
