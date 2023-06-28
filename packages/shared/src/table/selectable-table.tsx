import * as React from 'react';
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import { Bullseye } from '@patternfly/react-core';
import {
  SortByDirection,
  TableComposable,
  Tbody,
  Td,
  Th,
  ThProps,
  Thead,
  Tr,
} from '@patternfly/react-table';
import { useSelectList } from '../hooks/select-list';
import { useSortList } from '../hooks/sort-list';
import { getUID } from '../selectors';
import { useCustomTranslation } from '../useCustomTranslationHook';

const isRowSelectable = <T extends K8sResourceCommon>(row: T) =>
  !row?.metadata?.deletionTimestamp;

const areAllRowsSelected = <T extends K8sResourceCommon>(
  selectableRows: T[],
  selectedRows: T[]
) => {
  const selectedRowIds = selectedRows?.map(getUID);
  const selecteableRowsIds = selectableRows.map(getUID);
  return (
    selecteableRowsIds?.length &&
    selecteableRowsIds.every((rowId) => selectedRowIds?.includes(rowId))
  );
};

const isRowSelected = <T extends K8sResourceCommon>(
  rowId: string,
  selectedRows: T[]
) => selectedRows.some((row) => getUID(row) === rowId);

export const SelectableTable: SelectableTableProps = <
  T extends K8sResourceCommon
>(
  props: TableProps<T>
) => {
  const {
    selectedRows,
    setSelectedRows,
    columns,
    rows,
    RowComponent,
    extraProps,
  } = props;
  const { t } = useCustomTranslation();
  const {
    onSort,
    sortIndex: activeSortIndex,
    sortDirection: activeSortDirection,
    sortedData: sortedRows,
  } = useSortList<T>(rows, columns, true);

  const selectableRows = sortedRows?.filter(isRowSelectable) || [];

  const { onSelect } = useSelectList<T>(
    selectableRows,
    new Set(selectableRows?.map(getUID)),
    false,
    setSelectedRows
  );

  const getSortParams = (columnIndex: number): ThProps['sort'] => ({
    sortBy: {
      index: activeSortIndex,
      direction: activeSortDirection,
    },
    onSort: onSort,
    columnIndex,
  });

  return sortedRows?.length === 0 ? (
    <Bullseye>{t('Not found')}</Bullseye>
  ) : (
    <TableComposable
      translate={null}
      aria-label="Selectable table"
      variant="compact"
    >
      <Thead translate={null}>
        <Tr translate={null}>
          <Th
            translate={null}
            select={{
              onSelect: onSelect,
              isSelected: areAllRowsSelected(selectableRows, selectedRows),
            }}
          />
          {columns?.map((col, index) => (
            <Th
              {...(!!col?.sortFunction ? { sort: getSortParams(index) } : {})}
              translate={null}
              key={col?.columnName}
            >
              {col?.columnName}
            </Th>
          ))}
        </Tr>
      </Thead>
      <Tbody translate={null}>
        {sortedRows.map((row, rowIndex) => (
          <Tr translate={null} key={getUID(row)}>
            <Td
              translate={null}
              select={{
                rowIndex,
                onSelect: onSelect,
                isSelected: isRowSelected(getUID(row), selectedRows),
                disable: !isRowSelectable(row),
                props: {
                  id: getUID(row),
                },
              }}
            />
            <RowComponent row={row} extraProps={extraProps} />
          </Tr>
        ))}
      </Tbody>
    </TableComposable>
  );
};

export type TableColumnProps = {
  columnName: string;
  className?: string;
  sortFunction?: (a: any, b: any, c: SortByDirection) => any;
};

export type RowComponentType<T extends K8sResourceCommon> = {
  row: T;
  extraProps?: any;
};

export type TableProps<T extends K8sResourceCommon> = {
  rows: T[];
  columns: TableColumnProps[];
  RowComponent: React.ComponentType<RowComponentType<T>>;
  selectedRows: T[];
  setSelectedRows: (selectedRows: T[]) => void;
  extraProps?: any;
};

type SelectableTableProps = <T extends K8sResourceCommon>(
  props: React.PropsWithoutRef<TableProps<T>>
) => ReturnType<React.FC>;
