import React from 'react';
import natsort from 'natural-sort';
import { isEmpty, keyBy, mapValues, memoize } from 'lodash';
import { Loading, ServerSideAttributeFilter } from 'wdk-client/Components';
import { paramPropTypes } from './QuestionWizard';

let natSortComparator = natsort();

/**
 * FilterParamNew component
 */
export default class FilterParamNew extends React.PureComponent {
  constructor(props) {
    super(props);
    this._getFiltersFromValue = memoize(this._getFiltersFromValue);
    this._getFieldMap = memoize(this._getFieldMap);
    this._handleActiveFieldChange = this._handleActiveFieldChange.bind(this);
    this._handleFilterChange = this._handleFilterChange.bind(this);
    this._handleMemberSort = this._handleMemberSort.bind(this);
    this._handleMemberSearch = this._handleMemberSearch.bind(this);
    this._handleRangeScaleChange = this._handleRangeScaleChange.bind(this);
    this._renderSelectionInfo = this._renderSelectionInfo.bind(this);
  }

  _getFiltersFromValue(value) {
    let { filters = [] } = JSON.parse(value);
    return filters;
  }

  _getFieldMap(ontology) {
    return new Map(ontology.map(o => [
      o.term,
      // FIXME remove hardcoded mod when ontology query is updated
      o.term === 'EUPATH_0010399' // "Drinking water retrieval method"
        ? Object.assign({}, o , {
          isMulti: true,
          type: 'string'
        })
        : o
    ]));
  }

  _handleActiveFieldChange(term) {
    let filters = this._getFiltersFromValue(this.props.value);
    this.props.onActiveOntologyTermChange(this.props.param, filters, term);
  }

  _handleFilterChange(filters) {
    this.props.onParamValueChange(this.props.param, JSON.stringify({ filters }));

    // for each changed member updated member field, resort
    let prevFiltersByTerm = keyBy(this._getFiltersFromValue(this.props.value), 'field');
    let filtersByTerm = keyBy(filters, 'field');
    let fieldMap = this._getFieldMap(this.props.uiState.ontology);
    let ontologyTermSummaries = mapValues(this.props.uiState.ontologyTermSummaries, (summary, term) =>
      fieldMap.get(term).isRange || filtersByTerm[term] === prevFiltersByTerm[term]
      ? summary
      : Object.assign({}, summary, {
        valueCounts: sortDistribution(
          summary.valueCounts,
          (this.props.uiState.fieldStates[term] || this.props.uiState.defaultMemberFieldState).sort,
          filtersByTerm[term]
        )
      })
    );
    this.props.onParamStateChange(this.props.param, Object.assign({}, this.props.uiState, { ontologyTermSummaries }));
  }

  _handleMemberSort(field, sort) {
    let { ontologyTermSummaries, fieldStates, defaultMemberFieldState } = this.props.uiState;
    let filters = this._getFiltersFromValue(this.props.value);
    let filter = filters.find(f => f.field === field.term);
    let newState = Object.assign({}, this.props.uiState, {
      ontologyTermSummaries: Object.assign({}, ontologyTermSummaries, {
        [field.term]: Object.assign({}, ontologyTermSummaries[field.term], {
          valueCounts: sortDistribution(ontologyTermSummaries[field.term].valueCounts, sort, filter)
        })
      }),
      fieldStates: Object.assign({}, fieldStates, {
        [field.term]: Object.assign({}, fieldStates[field.term] || defaultMemberFieldState, {
          sort
        })
      })
    });
    this.props.onParamStateChange(this.props.param, newState);
  }

  _handleMemberSearch(field, searchTerm) {
    let { fieldStates, defaultMemberFieldState } = this.props.uiState;
    let newState = Object.assign({}, this.props.uiState, {
      fieldStates: Object.assign({}, fieldStates, {
        [field.term]: Object.assign({}, fieldStates[field.term] || defaultMemberFieldState, {
          searchTerm
        })
      })
    });
    this.props.onParamStateChange(this.props.param, newState);
  }

  _handleRangeScaleChange(field, state) {
    let newState = Object.assign({}, this.props.uiState, {
      fieldStates: Object.assign({}, this.props.uiState.fieldStates, {
        [field.term]: state
      })
    });
    this.props.onParamStateChange(this.props.param, newState);
  }

  _renderSelectionInfo({ filters }) {
    if (this.props.uiState.hideFilterPanel && isEmpty(filters)) {
      return <em>No filters currently applied.</em>
    }
    return null;
  }

  render() {
    let { param, uiState } = this.props;
    let fields = this._getFieldMap(uiState.ontology);
    let filters = this._getFiltersFromValue(this.props.value);
    let activeField = fields.get(uiState.activeOntologyTerm);
    let activeFieldState = uiState.fieldStates[uiState.activeOntologyTerm];
    let activeFieldSummary = uiState.ontologyTermSummaries[uiState.activeOntologyTerm];

    if (activeFieldState == null) {
      activeFieldState = activeField.isRange
        ? uiState.defaultRangeFieldState
        : uiState.defaultMemberFieldState;
      if (activeFieldSummary != null && !activeField.isRange) {
        activeFieldSummary = Object.assign({}, activeFieldSummary, {
          valueCounts: sortDistribution(activeFieldSummary.valueCounts, activeFieldState.sort)
        });
      }
    }

    return (
      <div className="filter-param">
        {uiState.errorMessage && <pre style={{color: 'red'}}>{uiState.errorMessage}</pre>}
        {uiState.loading && <Loading/>}
        <ServerSideAttributeFilter
          autoFocus={this.props.autoFocus}
          displayName={param.filterDataTypeDisplayName || param.displayName}

          fields={fields}
          filters={filters}
          dataCount={uiState.unfilteredCount}
          filteredDataCount={uiState.filteredCount}

          activeField={activeField}
          activeFieldState={activeFieldState}
          activeFieldSummary={activeFieldSummary}

          hideFilterPanel={uiState.hideFilterPanel}
          hideFieldPanel={uiState.hideFieldPanel}

          onFiltersChange={this._handleFilterChange}
          onActiveFieldChange={this._handleActiveFieldChange}
          onMemberSort={this._handleMemberSort}
          onMemberSearch={this._handleMemberSearch}
          onRangeScaleChange={this._handleRangeScaleChange}
          renderSelectionInfo={this._renderSelectionInfo}
        />
      </div>
    )
  }
}

FilterParamNew.propTypes = paramPropTypes;

/**
 * Compare distribution values using a natural comparison algorithm.
 * @param {string|null} valueA
 * @param {string|null} valueB
 */
function compareDistributionValues(valueA, valueB) {
  return natSortComparator(
    valueA == null ? '' : valueA,
    valueB == null ? '' : valueB
  );
}

/**
 * Compare values based on inclusion in array.
 */
function makeSelectionComparator(values) {
  let set = new Set(values);
  return function compareValuesBySelection(a, b) {
    return set.has(a.value) && !set.has(b.value) ? -1
      : set.has(b.value) && !set.has(a.value) ? 1
      : 0;
  }
}

/**
 * Sort distribution based on sort spec. `SortSpec` is an object with two
 * properties: `columnKey` (the distribution property to sort by), and
 * `direction` (one of 'asc' or 'desc').
 * @param {Distribution} distribution
 * @param {SortSpec} sort
 */
export function sortDistribution(distribution, sort, filter) {
  let { columnKey, direction, groupBySelected } = sort;

  let sortedDist = distribution.slice().sort(function compare(a, b) {
    let order =
      // if a and b are equal, fall back to comparing `value`
      columnKey === 'value' || a[columnKey] === b[columnKey]
        ? compareDistributionValues(a.value, b.value)
        : a[columnKey] > b[columnKey] ? 1 : -1;
    return direction === 'desc' ? -order : order;
  });

  return groupBySelected && filter && filter.value && filter.value.length > 0
    ? sortedDist.sort(makeSelectionComparator(filter.value))
    : sortedDist;
}
