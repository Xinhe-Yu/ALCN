import { EntryWithTranslations } from '@/app/types';
import { ColumnConfig } from './column-config';
import { EditingCell } from './use-inline-editing';
import TableCell from './table-cell';

interface TableBodyProps {
  entries: EntryWithTranslations[];
  visibleColumns: ColumnConfig[];
  selectedIds: Set<string>;
  editingCell: EditingCell | null;
  editValue: string;
  onRowSelect: (id: string, isSelected: boolean) => void;
  onEditValueChange: (value: string) => void;
  onStartEditing: (entryId: string, field: string, currentValue: string) => void;
  onCancelEditing: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

export default function TableBody({
  entries,
  visibleColumns,
  selectedIds,
  editingCell,
  editValue,
  onRowSelect,
  onEditValueChange,
  onStartEditing,
  onCancelEditing,
  onKeyPress
}: TableBodyProps) {
  return (
    <tbody className="bg-white divide-y divide-gray-200">
      {entries.map((entry) => {
        const isSelected = selectedIds.has(entry.id);
        const firstTranslation = entry.translations?.[0];

        return (
          <tr key={entry.id} className={isSelected ? 'bg-amber-50' : 'hover:bg-gray-50'}>
            <td className="p-1">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onRowSelect(entry.id, e.target.checked)}
                className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
              />
            </td>
            {visibleColumns.map(column => (
              <td key={column.key} className="p-1 whitespace-nowrap">
                <TableCell
                  entry={entry}
                  firstTranslation={firstTranslation}
                  column={column}
                  editingCell={editingCell}
                  editValue={editValue}
                  onEditValueChange={onEditValueChange}
                  onStartEditing={onStartEditing}
                  onCancelEditing={onCancelEditing}
                  onKeyPress={onKeyPress}
                />
              </td>
            ))}
            <td className="p-1 whitespace-nowrap text-sm font-medium">
              <div className="flex space-x-2">
                <button className="text-amber-600 hover:text-amber-900">Edit</button>
                <button className="text-red-600 hover:text-red-900">Delete</button>
              </div>
            </td>
          </tr>
        );
      })}
    </tbody>
  );
}
