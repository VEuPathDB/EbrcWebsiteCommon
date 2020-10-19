import React, { useMemo, useState } from 'react';

import { orderBy } from 'lodash';

import { RealTimeSearchBox } from 'wdk-client/Components';
import Mesa, { MesaState } from 'wdk-client/Components/Mesa';
import { MesaColumn, MesaSortObject } from 'wdk-client/Core/CommonTypes';
import { Seq } from 'wdk-client/Utils/IterableUtils';
import {
  areTermsInString,
  parseSearchQueryString
} from 'wdk-client/Utils/SearchUtils';

import { cx } from 'ebrc-client/components/StudyAccess/StudyAccess';

export interface Props<R, C extends UserTableColumnKey<R>> {
  rows: R[];
  columns: UserTableColumns<R, C>;
  columnOrder: readonly C[];
  // isRowSelected: (row: R) => boolean;
  // filterTerm
  // sortColumn
}

export type UserTableColumnKey<R> = keyof R & string;

export interface UserTableSortObject<R, K extends UserTableColumnKey<R>> extends MesaSortObject {
  columnKey: K;
  direction: 'asc' | 'desc';
};

export interface UserTableColumn<R, K extends UserTableColumnKey<R>> extends MesaColumn<K> {
  renderCell?: (props: { row: R, value: R[K] }) => React.ReactNode;
  makeSearchableString?: (value: R[K]) => string;
  makeOrder?: (row: R) => boolean | number | string;
}

export type UserTableColumns<R, C extends UserTableColumnKey<R>> = {
  [K in C]: UserTableColumn<R, K>
};

export function UserTable<R, C extends UserTableColumnKey<R>>({
  columnOrder,
  columns,
  rows
}: Props<R, C>) {
  const [ searchTerm, setSearchTerm ] = useState('');

  const initialSortUiState: UserTableSortObject<R, C> =
    { columnKey: columns[columnOrder[0]].key, direction: 'asc' };
  const [ sortUiState, setSortUiState ] = useState(initialSortUiState);

  const mesaRows = useMemo(
    () => makeMesaRows(rows, columns, sortUiState),
    [ rows, columns, sortUiState ]
  );

  const mesaFilteredRows = useMesaFilteredRows(mesaRows, columns, columnOrder, searchTerm);

  const mesaColumns = useMemo(() => makeMesaColumns(columns, columnOrder), [ columns, columnOrder ]);

  const mesaOptions = useMemo(
    () => makeMesaOptions(),
    [ ]
  );
  const mesaEventHandlers = useMemo(() => makeMesaEventHandlers(setSortUiState), []);
  const mesaUiState = useMemo(() => makeMesaUiState(sortUiState), [ sortUiState ]);

  const mesaState = useMemo(
    () => MesaState.create({
      rows: mesaRows,
      filteredRows: mesaFilteredRows,
      columns: mesaColumns,
      options: mesaOptions,
      eventHandlers: mesaEventHandlers,
      uiState: mesaUiState
    }),
    [ mesaRows, mesaFilteredRows, mesaColumns, mesaOptions, mesaEventHandlers, mesaUiState ]
  );

  return (
    <div className={cx('--UserTable')}>
      <Mesa state={mesaState}>
        <div className={cx('--SearchBoxContainer')}>
          <span>Search: </span>
          <RealTimeSearchBox
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            helpText="The entire table will be searched"
          />
        </div>
      </Mesa>
    </div>
  );
}

function makeMesaRows<R, C extends UserTableColumnKey<R>>(
  rows: Props<R, C>['rows'],
  columns: Props<R, C>['columns'],
  sortUiState: UserTableSortObject<R, C>
) {
  const { columnKey: sortKey, direction: sortDirection } = sortUiState;

  const makeOrder = columns[sortKey].makeOrder;

  return makeOrder == null
    ? orderBy(rows, sortKey, sortDirection)
    : orderBy(rows, makeOrder, sortDirection);
}

function useMesaFilteredRows<R, C extends UserTableColumnKey<R>>(
  rows: Props<R, C>['rows'],
  columns: Props<R, C>['columns'],
  columnOrder: Props<R, C>['columnOrder'],
  searchTerm: string
) {
  const searchTerms = useMemo(
    () => parseSearchQueryString(searchTerm),
    [ searchTerm ]
  );

  const rowsWithSearchableString = useMemo(
    () => Seq.from(rows).map(row => {
      const searchableColumnStrings = columnOrder.map(columnKey => {
        const { makeSearchableString } = columns[columnKey];

        return makeSearchableString == null
          ? String(row[columnKey])
          : makeSearchableString(row[columnKey]);
      });

      const searchableRowString = searchableColumnStrings.join('\0');

      return {
        row,
        searchableRowString
      };
    }),
    [ rows, columns, columnOrder ]
  );

  return useMemo(
    () => (
      rowsWithSearchableString
        .filter(
          ({ searchableRowString }) => areTermsInString(searchTerms, searchableRowString)
        )
        .map(
          ({ row }) => row
        )
        .toArray()
    ),
    [ rowsWithSearchableString, searchTerms ]
  );
}

function makeMesaColumns<R, C extends UserTableColumnKey<R>>(
  columns: Props<R, C>['columns'],
  columnOrder: Props<R, C>['columnOrder']
) {
  return columnOrder.map(columnKey => columns[columnKey]);
}

function makeMesaEventHandlers<R, C extends UserTableColumnKey<R>>(
  setSortUiState: (newSort: UserTableSortObject<R, C>) => void
) {
  return {
    onSort: ({ key }: { key: C }, direction: UserTableSortObject<R, C>['direction']) => {
      setSortUiState({ columnKey: key, direction });
    }
  };
};

function makeMesaUiState<R, C extends UserTableColumnKey<R>>(sort: UserTableSortObject<R, C>) {
  return {
    sort
  };
}

function makeMesaOptions() {
  return {
    toolbar: true
  };
}
