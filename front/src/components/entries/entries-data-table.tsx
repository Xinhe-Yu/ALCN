'use client';

import { useState, useEffect, useCallback } from 'react';
import { entriesService } from '@/lib/services';
import { useDebounce } from '@/lib/hooks/useDebounce';
import type {
  EntryWithTranslations,
  EntrySearchParams,
  PaginatedEntries,
  LanguageCode,
  EntryType
} from '@/app/types';
import { LANGUAGE_OPTIONS, ENTRY_TYPE_OPTIONS } from '@/app/types';
import { PlusIcon, TrashIcon, PencilIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../ui/loading-spinner';
import AutoSearchBar from '../ui/auto-search-bar';
import { AVAILABLE_COLUMNS, DEFAULT_VISIBLE_COLUMNS, PAGE_SIZE_OPTIONS, PageSize } from './data-table/column-config';
import { useInlineEditing } from './data-table/use-inline-editing';
import ColumnSelector from './data-table/column-selector';
import TableCell from './data-table/table-cell';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface EntriesDataTableProps {
  // Could add props here if needed
}

export default function EntriesDataTable({ }: EntriesDataTableProps) {
  // Data state
  const [entries, setEntries] = useState<EntryWithTranslations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(50);
  const [totalPages, setTotalPages] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState<LanguageCode | ''>('');
  const [typeFilter, setTypeFilter] = useState<EntryType | ''>('');
  const [searchLoading, setSearchLoading] = useState(false);

  // Debounce search query with 300ms delay
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Sorting state
  const [sortBy, setSortBy] = useState<string>('updated_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(DEFAULT_VISIBLE_COLUMNS));

  // Fetch data
  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: EntrySearchParams = {
        skip: (currentPage - 1) * pageSize,
        limit: pageSize,
        sorted_by: sortBy,
        sort_direction: sortDirection,
      };

      // Add search params
      if (debouncedSearchQuery.trim()) {
        params.fuzzy_search = debouncedSearchQuery.trim();
      }
      if (languageFilter) {
        params.language_code = languageFilter;
      }
      if (typeFilter) {
        params.entry_type = typeFilter;
      }

      const result: PaginatedEntries = await entriesService.getEntries(params);

      setEntries(result.items);
      setTotalPages(result.pages);
      setTotalEntries(result.total);

      // Clear selection when data changes
      setSelectedIds(new Set());
      setIsAllSelected(false);

    } catch (err) {
      console.error('Error fetching entries:', err);
      setError('Failed to load entries');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, sortBy, sortDirection, debouncedSearchQuery, languageFilter, typeFilter]);

  // Inline editing hook (after fetchEntries is defined)
  const inlineEditing = useInlineEditing(fetchEntries);

  // Effect to fetch data when params change
  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Set search loading state when user starts typing
  useEffect(() => {
    if (searchQuery.trim() && searchQuery !== debouncedSearchQuery) {
      setSearchLoading(true);
    } else {
      setSearchLoading(false);
    }
  }, [searchQuery, debouncedSearchQuery]);

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  // Handle row selection
  const handleRowSelect = (id: string, isSelected: boolean) => {
    const newSelectedIds = new Set(selectedIds);
    if (isSelected) {
      newSelectedIds.add(id);
    } else {
      newSelectedIds.delete(id);
    }
    setSelectedIds(newSelectedIds);

    // Update "select all" state
    setIsAllSelected(newSelectedIds.size === entries.length && entries.length > 0);
  };

  // Handle select all
  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedIds(new Set(entries.map(entry => entry.id)));
      setIsAllSelected(true);
    } else {
      setSelectedIds(new Set());
      setIsAllSelected(false);
    }
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: PageSize) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page
  };

  // Handle filters
  const clearFilters = () => {
    setSearchQuery('');
    setLanguageFilter('');
    setTypeFilter('');
    setCurrentPage(1);
  };


  // Column visibility handlers
  const toggleColumn = (columnKey: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(columnKey)) {
      newVisible.delete(columnKey);
    } else {
      newVisible.add(columnKey);
    }
    setVisibleColumns(newVisible);
  };

  const getVisibleColumnConfigs = () => {
    return AVAILABLE_COLUMNS.filter(col => visibleColumns.has(col.key));
  };

  // Get sort icon
  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortDirection === 'asc' ?
      <ChevronUpIcon className="h-4 w-4" /> :
      <ChevronDownIcon className="h-4 w-4" />;
  };

  // Calculate pagination info
  const startEntry = (currentPage - 1) * pageSize + 1;
  const endEntry = Math.min(currentPage * pageSize, totalEntries);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" message="Loading entries..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchEntries}
          className="mt-2 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4">


      {/* Header with search and filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-medium text-gray-900">Entries Management</h3>
          <span className="text-sm text-gray-500">
            {totalEntries} total entries
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Entry
          </button>

          <ColumnSelector
            visibleColumns={visibleColumns}
            onToggleColumn={toggleColumn}
          />

          {selectedIds.size > 0 && (
            <>
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit ({selectedIds.size})
              </button>
              <button className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50">
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete ({selectedIds.size})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search and filter bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <AutoSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            loading={searchLoading}
            placeholder="Search entries..."
          />
        </div>

        <select
          value={languageFilter}
          onChange={(e) => setLanguageFilter(e.target.value as LanguageCode | '')}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
        >
          <option value="">All Languages</option>
          {Object.entries(LANGUAGE_OPTIONS).map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as EntryType | '')}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
        >
          <option value="">All Types</option>
          {Object.entries(ENTRY_TYPE_OPTIONS).map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>

        {(searchQuery || languageFilter || typeFilter) && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table with Sticky Header */}
      <div className="bg-white shadow sm:rounded-lg flex-1">
        <div className="h-full">
          <table className="min-w-full">
            <thead className="bg-gray-50 sticky top-0 z-100">
              <tr>
                <th className="p-1 text-left bg-gray-50 border-b border-gray-200">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                  />
                </th>
                {getVisibleColumnConfigs().map(column => (
                  <th
                    key={column.key}
                    className={`p-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200 ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                      }`}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center">
                      {column.label}
                      {column.sortable && getSortIcon(column.key)}
                    </div>
                  </th>
                ))}
                <th className="p-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                  Actions
                </th>
              </tr>
            </thead>

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
                        onChange={(e) => handleRowSelect(entry.id, e.target.checked)}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                      />
                    </td>
                    {getVisibleColumnConfigs().map(column => (
                      <td key={column.key} className="p-1 whitespace-nowrap">
                        <TableCell
                          entry={entry}
                          firstTranslation={firstTranslation}
                          column={column}
                          editingCell={inlineEditing.editingCell}
                          editValue={inlineEditing.editValue}
                          onEditValueChange={inlineEditing.setEditValue}
                          onStartEditing={inlineEditing.startEditing}
                          onCancelEditing={inlineEditing.cancelEditing}
                          onKeyPress={inlineEditing.handleKeyPress}
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
          </table>
        </div>

        {entries.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No entries found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-700">
            Showing {startEntry} to {endEntry} of {totalEntries} entries
          </span>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value) as PageSize)}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm"
            >
              {PAGE_SIZE_OPTIONS.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>

          {/* Page numbers */}
          {[...Array(Math.min(5, totalPages))].map((_, i) => {
            const pageNum = currentPage > 3 ? currentPage - 2 + i : i + 1;
            if (pageNum > totalPages) return null;

            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`px-3 py-1 border rounded-md text-sm ${pageNum === currentPage
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'border-gray-300 hover:bg-gray-50'
                  }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
