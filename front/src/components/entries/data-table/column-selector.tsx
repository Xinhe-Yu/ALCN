import { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { AVAILABLE_COLUMNS } from './column-config';

interface ColumnSelectorProps {
  visibleColumns: Set<string>;
  onToggleColumn: (columnKey: string) => void;
}

export default function ColumnSelector({ visibleColumns, onToggleColumn }: ColumnSelectorProps) {
  const [showSelector, setShowSelector] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowSelector(!showSelector)}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
      >
        {showSelector ? <EyeSlashIcon className="h-4 w-4 mr-1" /> : <EyeIcon className="h-4 w-4 mr-1" />}
        Columns ({visibleColumns.size})
      </button>

      {showSelector && (
        <>
          {/* Click outside to close */}
          <div
            className="fixed inset-0 z-0"
            onClick={() => setShowSelector(false)}
          />

          <div className="absolute right-0 mt-1 w-64 bg-white border border-gray-300 rounded-md shadow-lg z-10">
            <div className="p-3">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Show/Hide Columns</h4>
              <div className="space-y-2 max-h-64">
                {AVAILABLE_COLUMNS.map(column => (
                  <label key={column.key} className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={visibleColumns.has(column.key)}
                      onChange={() => onToggleColumn(column.key)}
                      className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded mr-2"
                    />
                    <span className="text-gray-700">{column.label}</span>
                    <span className="ml-auto text-xs text-gray-500">
                      {column.source === 'entry' ? 'E' : column.source === 'translation' ? 'T' : 'C'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
