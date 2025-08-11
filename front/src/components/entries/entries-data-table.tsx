'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { entriesService } from '@/lib/services';
import { useDebounce } from '@/lib/hooks/useDebounce';
import type {
  EntryWithTranslations,
  EntrySearchParams,
  PaginatedEntries,
  LanguageCode,
  EntryType
} from '@/app/types';
import type {
  BulkUpdates
} from '@/app/types/crud';
import { LANGUAGE_OPTIONS, ENTRY_TYPE_OPTIONS } from '@/app/types';
import { PlusIcon, TrashIcon, PencilIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../ui/loading-spinner';
import AutoSearchBar from '../ui/auto-search-bar';
import { AVAILABLE_COLUMNS, DEFAULT_VISIBLE_COLUMNS, PAGE_SIZE_OPTIONS, PageSize, ENTRY_TYPE_COLORS } from './data-table/column-config';
import { useInlineEditing } from './data-table/use-inline-editing';
import ColumnSelector from './data-table/column-selector';
import EditableCell from './data-table/editable-cell';
import Badge from '../ui/badge';
import { useToast } from '@/lib/context/ToastContext';
import ConfirmationModal from '../ui/confirmation-modal';
import {
  saveVisibleColumns,
  getVisibleColumns,
  savePageSize,
  getPageSize,
  saveSortingPreferences,
  getSortingPreferences
} from '@/lib/utils/preferences';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface EntriesDataTableProps {
  // Could add props here if needed
}

export default function EntriesDataTable({ }: EntriesDataTableProps) {
  const toast = useToast();
  // Data state
  const [entries, setEntries] = useState<EntryWithTranslations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(() => {
    // Initialize from localStorage or default to 50
    return getPageSize() || 50;
  });
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
  const [sortBy, setSortBy] = useState<string>(() => {
    // Initialize from localStorage or default to 'updated_at'
    return getSortingPreferences()?.sortBy || 'updated_at';
  });
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(() => {
    // Initialize from localStorage or default to 'desc'
    return getSortingPreferences()?.sortDirection || 'desc';
  });

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);

  // Confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    // Initialize from localStorage or default visible columns
    return getVisibleColumns() || new Set(DEFAULT_VISIBLE_COLUMNS);
  });

  // Bulk modification state
  const [showBulkOptions, setShowBulkOptions] = useState(false);
  const [bulkFieldType, setBulkFieldType] = useState<'language_code' | 'entry_type' | null>(null);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Track if this is the initial load using ref to avoid re-renders
  const isInitialMountRef = useRef(true);

  // Fetch data with smooth loading states
  const fetchEntries = useCallback(async () => {
    try {
      // Only show full loading on initial load, not during search
      if (isInitialMountRef.current) {
        setLoading(true);
        isInitialMountRef.current = false;
      }
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

      // Only clear selection when actual search/filter criteria change
      // (not on pagination or sorting changes)
      // This provides better UX by preserving selections during searches

    } catch (err) {
      console.error('Error fetching entries:', err);
      setError('Failed to load entries');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, sortBy, sortDirection, debouncedSearchQuery, languageFilter, typeFilter]);

  // Ref to track processed updates to prevent duplicate executions
  const processedUpdatesRef = useRef(new Set<string>());

  // Ref for bulk options dropdown
  const bulkOptionsRef = useRef<HTMLDivElement>(null);

  // Optimistic update function for inline editing - PERFORMANCE OPTIMIZED
  const handleOptimisticUpdate = useCallback((entryId: string, field: string, value: string) => {
    const timestamp = Date.now();
    const updateKey = `${entryId}-${field}-${value}-${timestamp}`;

    // Check for duplicates BEFORE calling setEntries
    const recentUpdates = Array.from(processedUpdatesRef.current).filter(key => {
      const keyTimestamp = parseInt(key.split('-').pop() || '0');
      return timestamp - keyTimestamp < 50; // Very short window - only 50ms
    });

    const duplicateKey = recentUpdates.find(key =>
      key.startsWith(`${entryId}-${field}-${value}-`)
    );

    if (duplicateKey) {
      return; // Exit early, don't call setEntries at all
    }

    // Mark this update as processed BEFORE setEntries
    processedUpdatesRef.current.add(updateKey);

    setEntries(currentEntries => {
      // Clean up old entries to prevent memory leaks (keep last 20)
      if (processedUpdatesRef.current.size > 20) {
        const entries = Array.from(processedUpdatesRef.current);
        processedUpdatesRef.current.clear();
        // Keep only recent entries (last 5 minutes)
        entries.filter(key => {
          const keyTimestamp = parseInt(key.split('-').pop() || '0');
          return timestamp - keyTimestamp < 300000; // 5 minutes
        }).forEach(key => processedUpdatesRef.current.add(key));
      }

      // Find the index of the entry to update
      const entryIndex = currentEntries.findIndex(entry => entry.id === entryId);
      if (entryIndex === -1) {
        return currentEntries; // No change if entry not found
      }

      // Create a shallow copy of the array
      const updatedEntries = [...currentEntries];

      // Create updated entry (only the one that changed)
      const originalEntry = currentEntries[entryIndex];
      const updatedEntry = { ...originalEntry };

      // Update the specific field
      switch (field) {
        case 'primary_name':
          updatedEntry.primary_name = value;
          break;
        case 'original_script':
          updatedEntry.original_script = value;
          break;
        case 'language_code':
          updatedEntry.language_code = value;
          break;
        case 'entry_type':
          updatedEntry.entry_type = value || undefined;
          break;
        case 'alternative_names':
          updatedEntry.alternative_names = value ? value.split(', ').map(name => name.trim()) : [];
          break;
        case 'etymology':
          updatedEntry.etymology = value;
          break;
        case 'definition':
          updatedEntry.definition = value;
          break;
        case 'historical_context':
          updatedEntry.historical_context = value;
          break;
        case 'verification_notes':
          updatedEntry.verification_notes = value;
          break;
        case 'first_translation':
          // Update the first translation if it exists
          if (updatedEntry.translations && updatedEntry.translations[0]) {
            updatedEntry.translations = [...updatedEntry.translations];
            updatedEntry.translations[0] = { ...updatedEntry.translations[0], translated_name: value };
          }
          break;
        case 'translation_notes':
          console.log('Updating translation_notes:', value);
          // Update the first translation notes if it exists
          if (updatedEntry.translations && updatedEntry.translations[0]) {
            updatedEntry.translations = [...updatedEntry.translations];
            updatedEntry.translations[0] = { ...updatedEntry.translations[0], notes: value };
          }
          break;
        default:
          console.log('Unknown field:', field);
          return currentEntries; // No change for unknown fields
      }

      // Replace only the single updated entry
      updatedEntries[entryIndex] = updatedEntry;

      console.log(`[${updateKey}] Updated single entry (not entire array):`, updatedEntry);
      console.log(`[${updateKey}] Returning new entries array with ${updatedEntries.length} items`);
      console.log(`[${updateKey}] Original entry:`, originalEntry);
      console.log(`[${updateKey}] Updated entry reference changed:`, originalEntry !== updatedEntry);
      return updatedEntries;
    });
  }, []); // Empty dependency array since we only use setEntries (stable) and the parameters

  // Inline editing hook (with optimistic updates)
  const inlineEditing = useInlineEditing(handleOptimisticUpdate);

  // Effect to fetch data when params change
  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Close bulk options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bulkOptionsRef.current && !bulkOptionsRef.current.contains(event.target as Node)) {
        setShowBulkOptions(false);
        setBulkFieldType(null);
      }
    };

    if (showBulkOptions || bulkFieldType) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showBulkOptions, bulkFieldType]);

  // Save preferences to localStorage when they change
  useEffect(() => {
    saveVisibleColumns(visibleColumns);
  }, [visibleColumns]);

  useEffect(() => {
    savePageSize(pageSize);
  }, [pageSize]);

  useEffect(() => {
    saveSortingPreferences(sortBy, sortDirection);
  }, [sortBy, sortDirection]);

  // Set search loading state when user starts typing
  useEffect(() => {
    if (searchQuery.trim() && searchQuery !== debouncedSearchQuery) {
      setSearchLoading(true);
    } else {
      setSearchLoading(false);
    }
  }, [searchQuery, debouncedSearchQuery]);

  // Handle filter changes: reset page and clear selections in one effect
  // This prevents multiple API calls by batching state updates
  useEffect(() => {
    setSelectedIds(new Set());
    setIsAllSelected(false);
  }, [debouncedSearchQuery, languageFilter, typeFilter, currentPage]);

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

  // Handle direct page input
  const [pageInputValue, setPageInputValue] = useState('');

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      setPageInputValue(value);
    }
  };

  const handleFirstPage = () => {
    handlePageChange(1);
  };

  const handleLastPage = () => {
    handlePageChange(totalPages);
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

  // Handle bulk update
  const handleBulkUpdate = async (fieldType: 'language_code' | 'entry_type', value: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.warning('Authentication Required', 'You must be logged in to perform mass updates.');
      return;
    }

    if (selectedIds.size === 0) {
      toast.info('No Selection', 'Please select entries to update.');
      return;
    }

    setIsBulkUpdating(true);
    try {
      const updates: BulkUpdates = {};
      if (fieldType === 'language_code') {
        updates.language_code = value;
      } else if (fieldType === 'entry_type') {
        updates.entry_type = value || null; // Empty string becomes null
      }

      const bulkUpdateData = {
        entry_ids: Array.from(selectedIds),
        updates
      };

      await entriesService.bulkUpdateEntries(bulkUpdateData);

      // Update local state optimistically
      setEntries(currentEntries =>
        currentEntries.map(entry => {
          if (selectedIds.has(entry.id)) {
            return {
              ...entry,
              ...(fieldType === 'language_code' && { language_code: value }),
              ...(fieldType === 'entry_type' && { entry_type: value || undefined })
            };
          }
          return entry;
        })
      );

      // Clear selection and close bulk options
      setSelectedIds(new Set());
      setIsAllSelected(false);
      setShowBulkOptions(false);
      setBulkFieldType(null);

      toast.success('Mass Update Successful', `Successfully updated ${selectedIds.size} entries.`);
    } catch (error) {
      console.error('Mass update failed:', error);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Handle delete entry
  const handleDeleteEntry = (entryId: string) => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      toast.warning('Authentication Required', 'You must be logged in to delete entries. Please login first.');
      return;
    }
    // Show confirmation modal
    setEntryToDelete(entryId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!entryToDelete) return;

    setIsDeleting(true);
    try {
      await entriesService.deleteEntry({ id: entryToDelete });

      // Remove the entry from the local state immediately
      setEntries(currentEntries => currentEntries.filter(entry => entry.id !== entryToDelete));

      // Update total count
      setTotalEntries(prev => prev - 1);

      // Clear selection if deleted entry was selected
      setSelectedIds(prev => {
        const newSelected = new Set(prev);
        newSelected.delete(entryToDelete);
        return newSelected;
      });

      toast.success('Entry Deleted', 'Entry was successfully deleted.');

      // Close modal and reset state
      setShowDeleteConfirm(false);
      setEntryToDelete(null);
    } catch (error) {
      console.error('Failed to delete entry:', error);
      toast.error('Delete Failed', 'Failed to delete entry. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setEntryToDelete(null);
    setIsDeleting(false);
  };

  // Define column widths based on content type - MOVED OUTSIDE RENDER FOR PERFORMANCE
  // Get column width in pixels for strict table layout
  const getColumnWidth = useCallback((key: string): { className: string, width: string } => {
    switch (key) {
      case 'language_code':
      case 'is_verified': return { className: '', width: '40px' };
      case 'created_at':
      case 'updated_at':
      case 'entry_type': return { className: '', width: '64px' };
      case 'primary_name':
      case 'original_script':
      case 'alternative_names':
      case 'first_translation':
      case 'etymology':
      case 'definition': return { className: '', width: '96px' };
      case 'translation_notes': return { className: '', width: '224px' };
      case 'historical_context': return { className: '', width: '256px' };
      case 'verification_notes': return { className: '', width: '192px' };
      default: return { className: '', width: '144px' };
    }
  }, []);


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

  const getVisibleColumnConfigs = useMemo(() => {
    return AVAILABLE_COLUMNS.filter(col => visibleColumns.has(col.key));
  }, [visibleColumns]);

  // Get sort icon - memoized for performance
  const getSortIcon = useCallback((column: string) => {
    if (sortBy !== column) return null;
    return sortDirection === 'asc' ?
      <ChevronUpIcon className="h-4 w-4" /> :
      <ChevronDownIcon className="h-4 w-4" />;
  }, [sortBy, sortDirection]);

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
    <div className="h-full flex flex-col space-y-4 p-6">


      {/* Header with search and filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">Entries Management</h2>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>
              {debouncedSearchQuery || languageFilter || typeFilter ? (
                <>
                  {totalEntries} result{totalEntries !== 1 ? 's' : ''}
                  {debouncedSearchQuery && (
                    <span className="ml-2 px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs">
                      &quot;{debouncedSearchQuery}&quot;
                    </span>
                  )}
                </>
              ) : (
                `${totalEntries} total entries`
              )}
            </span>
          </div>
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
            <div ref={bulkOptionsRef} className="flex items-center gap-2 relative">
              <button
                onClick={() => setShowBulkOptions(!showBulkOptions)}
                disabled={isBulkUpdating}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                {isBulkUpdating ? 'Updating...' : `Mass Edit (${selectedIds.size})`}
              </button>

              {showBulkOptions && (
                <div className="absolute top-full left-0 z-[9999] mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                  <div className="py-1">
                    <button
                      onClick={() => setBulkFieldType('language_code')}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                    >
                      Change Language
                    </button>
                    <button
                      onClick={() => setBulkFieldType('entry_type')}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                    >
                      Change Type
                    </button>
                  </div>
                </div>
              )}

              {/* Language Code Dropdown */}
              {bulkFieldType === 'language_code' && (
                <div className="absolute top-full left-0 z-[9999] mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  <div className="py-1">
                    {Object.entries(LANGUAGE_OPTIONS).map(([code, name]) => (
                      <button
                        key={code}
                        onClick={() => handleBulkUpdate('language_code', code)}
                        disabled={isBulkUpdating}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-50 flex items-center space-x-2"
                      >
                        <Badge code={code} />
                        <span className="text-xs">{name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Entry Type Dropdown */}
              {bulkFieldType === 'entry_type' && (
                <div className="absolute top-full left-0 z-[9999] mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                  <div className="py-1">
                    <button
                      onClick={() => handleBulkUpdate('entry_type', '')}
                      disabled={isBulkUpdating}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-50"
                    >
                      <span className="text-gray-400">No type</span>
                    </button>
                    {Object.entries(ENTRY_TYPE_OPTIONS).map(([code, name]) => (
                      <button
                        key={code}
                        onClick={() => handleBulkUpdate('entry_type', code)}
                        disabled={isBulkUpdating}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-50"
                      >
                        <span className={`px-2 py-1 rounded-md text-xs font-medium border ${ENTRY_TYPE_COLORS[code] || ENTRY_TYPE_COLORS['']}`}>
                          {name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
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
      <div className="bg-white shadow sm:rounded-lg flex-1 relative">
        {/* Search loading overlay */}
        {searchLoading && entries.length > 0 && (
          <div className="absolute top-0 left-0 right-0 z-30 bg-amber-50 bg-opacity-90 flex items-center justify-center py-2">
            <div className="flex items-center space-x-2 text-amber-700">
              <div className="animate-spin h-4 w-4 border-2 border-amber-300 border-t-amber-600 rounded-full"></div>
              <span className="text-sm font-medium">Searching...</span>
            </div>
          </div>
        )}

        <div className="h-full">
          <table className="w-full table-fixed" style={{ tableLayout: 'fixed', minWidth: '1200px' }}>
            <thead className="bg-gray-50 sticky top-0 z-20">
              <tr>
                <th className="w-4 p-1 text-left bg-gray-50 border-b border-gray-200 relative z-20">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                  />
                </th>
                {getVisibleColumnConfigs.map(column => {
                  return (
                    <th
                      key={column.key}
                      className={`p-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200 overflow-hidden ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''} relative z-20`}
                      style={{ width: getColumnWidth(column.key).width }}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className="flex items-center min-w-0">
                        <span className="truncate">{column.label}</span>
                        {column.sortable && getSortIcon(column.key)}
                      </div>
                    </th>
                  );
                })}
                <th className="w-4 p-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200 relative z-20">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className={`bg-white divide-y divide-gray-200 transition-opacity duration-200 ${searchLoading && entries.length > 0 ? 'opacity-75' : 'opacity-100'}`}>
              {entries.map((entry) => {
                const isSelected = selectedIds.has(entry.id);
                const firstTranslation = entry.translations?.[0];

                return (
                  <tr key={entry.id} className={`transition-colors duration-150 ${isSelected ? 'bg-amber-50' : 'hover:bg-gray-50'}`}>
                    <td className="w-4 p-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleRowSelect(entry.id, e.target.checked)}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                      />
                    </td>
                    {getVisibleColumnConfigs.map(column => {
                      // Special handling for dropdown columns to allow overflow
                      const hasDropdown = column.key === 'language_code' || column.key === 'entry_type';
                      const cellClass = hasDropdown ? "p-1 relative" : "p-1 relative overflow-hidden";

                      return (
                        <td key={column.key} className={cellClass} style={{ width: getColumnWidth(column.key).width }}>
                          <div className="min-w-0 w-full">
                            <EditableCell
                              entry={entry}
                              firstTranslation={firstTranslation}
                              column={column}
                              editingCell={inlineEditing.editingCell}
                              editValue={inlineEditing.editValue}
                              onEditValueChange={inlineEditing.setEditValue}
                              onStartEditing={inlineEditing.startEditing}
                              onCancelEditing={inlineEditing.cancelEditing}
                              onKeyPress={inlineEditing.handleKeyPress}
                              onSaveEdit={inlineEditing.saveEditWithValue}
                            />
                          </div>
                        </td>
                      );
                    })}
                    <td className="w-24 p-1 text-sm font-medium">
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Delete entry"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
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
          {/* First page button */}
          <button
            onClick={handleFirstPage}
            disabled={currentPage <= 1}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            First
          </button>

          {/* Previous page button */}
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

          {/* Next page button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>

          {/* Last page button */}
          <button
            onClick={handleLastPage}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Last
          </button>

          {/* Direct page input */}
          {totalPages > 1 && (
            <div className="flex items-center space-x-1 ml-2 border border-gray-300 rounded-md px-3 py-1 bg-white text-sm">
              <input
                type="text"
                value={pageInputValue}
                onChange={handlePageInputChange}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const pageNum = parseInt(pageInputValue);
                    if (pageNum >= 1 && pageNum <= totalPages) {
                      handlePageChange(pageNum);
                      setPageInputValue('');
                    }
                  }
                }}
                placeholder={currentPage.toString()}
                className="w-8 text-sm text-center border-0 outline-none bg-transparent"
              />
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">{totalPages}</span>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Entry"
        message="Are you sure you want to delete this entry? This action cannot be undone and will remove all associated translations and comments."
        confirmText="Delete Entry"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
