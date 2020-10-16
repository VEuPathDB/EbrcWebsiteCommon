import React from 'react';

import { MesaColumn, MesaSortObject } from 'wdk-client/Core/CommonTypes';
import Mesa, { MesaState } from 'wdk-client/Components/Mesa';

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
  const state = MesaState.create({
    rows,
    columns: columnOrder.map(columnKey => columns[columnKey])
  });

  return <Mesa state={state} />;
}
