import React from 'react';
import { memoize } from 'lodash';
import FilterParamNew from './FilterParamNew';

export default class QuestionWizard extends React.Component {

  static createEmptyState() {
    return {
      activeGroup: undefined
    };
  }

  constructor(props) {
    super(props);
    this.setActiveGroup = this.setActiveGroup.bind(this);
  }

  setActiveGroup(activeGroup) {
    this._update({ activeGroup });
  }

  _update(nextState) {
    this.props.onChange(Object.assign({}, this.props.wizardState, nextState));
  }

  render() {
    const { question, wizardState } = this.props;
    const { activeGroup } = wizardState;
    return (
      <div>
        <h1>{question.displayName}</h1>
        <p>{question.summary}</p>
        <GroupList groups={question.groups} onGroupSelect={this.setActiveGroup}/>
        <div>
          {activeGroup == null ? (
            <div>Select a group above to get started</div>
          ) : (
            <div>
              <p>{activeGroup.description}</p>
              <ul>
                {activeGroup.parameters.map(renderParam(question))}
              </ul>
            </div>
          )}
        </div>
      </div>
    )
  }

}

const renderParam = question => paramName => {
  const param = question.parameters.find(p => p.name === paramName);
  const { Component, handler } = findParamStuff(param);
  return (
    <li key={paramName}>
      <Component param={param} handler={handler}/>
    </li>
  );
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

function findParamStuff(param) {
  if (param.type === 'FilterParamNew') {
    return {
      Component: FilterParamNew,
      handler: FilterParamNewHandler
    };
  }
  return {
    Component: Param,
    handler: {}
  };
}

const FilterParamNewHandler = (questionName, paramName) => ({

  getActiveFieldSummary: memoize((activeField) => {
    return fetch(`/a/service/question/${questionName}/${paramName}/ontologyTermSummary`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      redirect: 'follow',
      body: JSON.stringify({
        ontologyId: activeField.ontologyId,
        filters: [],
        contextParamValues: {}
      })
    })
      .then(response => response.json())
      .then(formatSummary);
  })

})

function formatSummary(summary) {
  return Object.keys(summary).map(value => ({
    value,
    count: summary[value].unfiltered,
    filteredCount: summary[value].filtered
  }));
}
