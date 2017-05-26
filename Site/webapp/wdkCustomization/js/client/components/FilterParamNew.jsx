import React from 'react';
import { Loading, ServerSideAttributeFilter } from 'wdk-client/Components';

export default function FilterParamNew(props) {
  const { param, value, uiState, onActiveOntologyTermChange, onParamValueChange } = props;
  const { filters = [] } = JSON.parse(value);
  return (
    <div className="filter-param">
      {uiState.errorMessage && <pre style={{color: 'red'}}>{uiState.errorMessage}</pre>}
      {uiState.loading && <Loading/>}
      <ServerSideAttributeFilter
        displayName={param.displayName}
        activeField={uiState.activeOntologyTerm}
        activeFieldSummary={uiState.ontologyTermSummaries[uiState.activeOntologyTerm]}
        fields={param.ontology}
        filters={filters}
        dataCount={uiState.counts.unfiltered}
        filteredDataCount={uiState.counts.filtered}
        onActiveFieldChange={term => onActiveOntologyTermChange(param, filters, term)}
        onFiltersChange={filters => onParamValueChange(param, JSON.stringify({ filters }))}
      />
    </div>
  )
}
