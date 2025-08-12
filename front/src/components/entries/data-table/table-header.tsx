import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { ColumnConfig } from './column-config';

interface TableHeaderProps {
  visibleColumns: ColumnConfig[];
  isAllSelected: boolean;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  onSelectAll: (isSelected: boolean) => void;
  onSort: (column: string) => void;
}

export default function TableHeader({
  visibleColumns,
  isAllSelected,
  sortBy,
  sortDirection,
  onSelectAll,
  onSort
}: TableHeaderProps) {
  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortDirection === 'asc' ?
      <ChevronUpIcon className="h-4 w-4" /> :
      <ChevronDownIcon className="h-4 w-4" />;
  };

  return (
    <thead>
      <tr>
        <th className="p-1 text-left">
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={(e) => onSelectAll(e.target.checked)}
            className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
          />
        </th>
        {visibleColumns.map(column => (
          <th
            key={column.key}
            className={`p-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
              }`}
            onClick={() => column.sortable && onSort(column.key)}
          >
            <div className="flex items-center">
              {column.label}
              {column.sortable && getSortIcon(column.key)}
            </div>
          </th>
        ))}
        <th className="p-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Actions
        </th>
      </tr>
    </thead>
  );
}
