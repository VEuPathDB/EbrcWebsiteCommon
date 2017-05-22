import React from 'react';
import { memoize } from 'lodash';
import { Loading, ServerSideAttributeFilter } from 'wdk-client/Components';

export default class FilterParamNew extends React.Component {

  constructor(props) {
    super(props);
    this.setActiveField = this.setActiveField.bind(this);
    this.makeOntologyTree = memoize(makeOntologyTree);
    this.state = { }
    this.activeFieldSummaryCache = new Map;
  }

  setActiveField(activeField) {
    this.setState({ loading: true });
    this.fetchActiveFieldSummary(activeField)
      .then(
        activeFieldSummary => this.setState({ activeField, activeFieldSummary }),
        error => this.setState({ errorMessage: error.message })
      )
      .then(() => this.setState({ loading: false }));
  }

  fetchActiveFieldSummary(activeField) {
    if (this.activeFieldSummaryCache.has(activeField.ontologyId)) {
      return this.activeFieldSummaryCache.get(activeField.ontologyId);
    }

    const activeFieldSummary = fetch('/a/service/question/ParticipantQuestions.ParticipantsByCharSteps/' + this.props.param.name + '/ontologyTermSummary', {
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
    this.activeFieldSummaryCache.set(activeField.ontologyId, activeFieldSummary);
    return activeFieldSummary;
  }

  render() {
    const { param, paramState, onActiveFieldChange, onFiltersChange } = this.props;
    return (
      <div className="filter-param">
        {paramState.errorMessage && <pre style={{color: 'red'}}>{paramState.errorMessage}</pre>}
        {paramState.loading && <Loading/>}
        <ServerSideAttributeFilter
          displayName={param.displayName}
          activeField={paramState.activeField}
          activeFieldSummary={paramState.activeFieldSummary}
          fields={paramState.fields}
          filters={paramState.filters}
          dataCount={paramState.dataCount}
          filteredDataCount={paramState.filteredDataCount}
          onActiveFieldChange={onActiveFieldChange}
          onFiltersChange={onFiltersChange}
        />
      </div>
    )
  }

}


function formatSummary(summary) {
  return Object.keys(summary).map(value => ({
    value,
    count: summary[value].unfiltered,
    filteredCount: summary[value].filtered
  }));
}
