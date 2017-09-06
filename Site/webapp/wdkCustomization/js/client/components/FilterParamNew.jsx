import React from 'react';
import { isEmpty } from 'lodash';
import { Loading, ServerSideAttributeFilter } from 'wdk-client/Components';
import { paramPropTypes } from './QuestionWizard';

/**
 * FilterParamNew component
 */
export default class FilterParamNew extends React.PureComponent {
  constructor(props) {
    super(props);
    this._handleActiveFieldChange = this._handleActiveFieldChange.bind(this);
    this._handleFilterChange = this._handleFilterChange.bind(this);
    this._renderSelectionInfo = this._renderSelectionInfo.bind(this);
  }

  _handleActiveFieldChange(term) {
    const { filters = [] } = JSON.parse(this.props.value);
    this.props.onActiveOntologyTermChange(this.props.param, filters, term);
  }

  _handleFilterChange(filters) {
    this.props.onParamValueChange(this.props.param, JSON.stringify({ filters }));
  }

  _renderSelectionInfo({ filters }) {
    if (this.props.uiState.hideFilterPanel && isEmpty(filters)) {
      return <em>No filters currently applied.</em>
    }
    return null;
  }

  render() {
    const { param, value, uiState } = this.props;
    const { filters = [] } = JSON.parse(value);
    return (
      <div className="filter-param">
        {uiState.errorMessage && <pre style={{color: 'red'}}>{uiState.errorMessage}</pre>}
        {uiState.loading && <Loading/>}
        <ServerSideAttributeFilter
          autoFocus={this.props.autoFocus}
          displayName={param.filterDataType || param.displayName}
          activeField={uiState.activeOntologyTerm}
          activeFieldSummary={uiState.ontologyTermSummaries[uiState.activeOntologyTerm]}
          hideFilterPanel={uiState.hideFilterPanel}
          hideFieldPanel={uiState.hideFieldPanel}
          fields={new Map(uiState.ontology.map(o => [ o.term, o]))}
          filters={filters}
          dataCount={uiState.unfilteredCount}
          filteredDataCount={uiState.filteredCount}
          onActiveFieldChange={this._handleActiveFieldChange}
          onFiltersChange={this._handleFilterChange}
          renderSelectionInfo={this._renderSelectionInfo}
        />
      </div>
    )
  }
}

FilterParamNew.propTypes = paramPropTypes;
