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
    this._handleActiveFieldChange = this._handleActiveFieldChange.bind(this);
    this._handleFilterChange = this._handleFilterChange.bind(this);
    this._handleMemberSort = this._handleMemberSort.bind(this);
    this._renderSelectionInfo = this._renderSelectionInfo.bind(this);
  }

  _getFiltersFromValue(value) {
    let { filters = [] } = JSON.parse(value);
    return filters;
  }

  _handleActiveFieldChange(term) {
    let filters = this._getFiltersFromValue(this.props.value);
    this.props.onActiveOntologyTermChange(this.props.param, filters, term);
  }

  _handleFilterChange(filters) {
    // for each changed member filter, remove sort spec from state
    let prevFilters = this._getFiltersFromValue(this.props.value);
    let filtersByField = keyBy(filters, 'field');
    let prevFiltersByField = keyBy(prevFilters, 'field');
    let nextFieldStates =
      mapValues(this.props.uiState.fieldStates, (fieldState, fieldTerm) => {
        if (
          filtersByField[fieldTerm] !== prevFiltersByField[fieldTerm] &&
          fieldState.sort.groupBySelected
        ) {
          return Object.assign({}, fieldState, {
            sort: Object.assign({}, fieldState.sort, { groupBySelected: false })
          });
        }
        return fieldState;
      })
    let nextState = Object.assign({}, this.props.uiState, {
      fieldStates: nextFieldStates
    });
    this.props.onParamStateChange(this.props.param, nextState);
    this.props.onParamValueChange(this.props.param, JSON.stringify({ filters }));
  }

  _handleMemberSort(field, sort) {
    let filters = this._getFiltersFromValue(this.props.value);
    let filter = filters.find(f => f.field === field.term);
    let newState = Object.assign({}, this.props.uiState, {
      ontologyTermSummaries: Object.assign({}, this.props.uiState.ontologyTermSummaries, {
        [field.term]: Object.assign({}, this.props.uiState.ontologyTermSummaries[field.term], {
          valueCounts: sortDistribution(this.props.uiState.ontologyTermSummaries[field.term].valueCounts, sort, filter)
        })
      }),
      fieldStates: Object.assign({}, this.props.uiState.fieldStates, {
        [field.term]: Object.assign({}, this.props.uiState.fieldStates[field.term], {
          sort: sort
        })
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
    let filters = this._getFiltersFromValue(this.props.value);
    let activeFieldState = uiState.fieldStates[uiState.activeOntologyTerm];
    let ontologyTermSummary = uiState.ontologyTermSummaries[uiState.activeOntologyTerm] || {};
    let activeFieldDistribution = ontologyTermSummary.valueCounts;

    if (activeFieldState == null) {
      activeFieldState = uiState.defaultMemberFieldState;
      activeFieldDistribution = activeFieldDistribution && sortDistribution(activeFieldDistribution, activeFieldState.sort);
    }

    return (
      <div className="filter-param">
        {uiState.errorMessage && <pre style={{color: 'red'}}>{uiState.errorMessage}</pre>}
        {uiState.loading && <Loading/>}
        <ServerSideAttributeFilter
          autoFocus={this.props.autoFocus}
          displayName={param.filterDataTypeDisplayName || param.displayName}

          activeField={uiState.activeOntologyTerm}
          activeFieldDistribution={activeFieldDistribution}
          activeFieldDistinctKnownCount={ontologyTermSummary.internalsCount}
          activeFieldFilteredDistinctKnownCount={ontologyTermSummary.internalsFilteredCount}
          activeFieldState={activeFieldState}
          fields={new Map(uiState.ontology.map(o => [ o.term, o]))}
          filters={filters}
          dataCount={uiState.unfilteredCount}
          filteredDataCount={uiState.filteredCount}

          hideFilterPanel={uiState.hideFilterPanel}
          hideFieldPanel={uiState.hideFieldPanel}

          onFiltersChange={this._handleFilterChange}
          onActiveFieldChange={this._handleActiveFieldChange}
          onMemberSort={this._handleMemberSort}
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
