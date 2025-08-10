'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
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
import { useAuth } from '@/lib/context/AuthContext';
import Navbar from '@/components/ui/navbar';
import AutoSearchBar from '@/components/ui/auto-search-bar';
import LoadingSpinner from '@/components/ui/loading-spinner';
import ErrorMessage from '@/components/ui/error-message';
import RecentItem from '@/components/entries/recent-item';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const SORT_OPTIONS = {
  'updated_at': 'Recently Updated',
  'created_at': 'Recently Created',
  'primary_name': 'Name (A-Z)',
  'language_code': 'Language'
};

export default function ListPage() {
  const { user, logout } = useAuth();
  const t = useTranslations();

  // Data state
  const [entries, setEntries] = useState<EntryWithTranslations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState<LanguageCode | ''>('');
  const [typeFilter, setTypeFilter] = useState<EntryType | ''>('');
  const [searchLoading, setSearchLoading] = useState(false);

  // Sorting state
  const [sortBy, setSortBy] = useState<string>('primary_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Debounce search query with 300ms delay
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch data
  const fetchEntries = useCallback(async () => {
    try {
      if (entries.length === 0) {
        setLoading(true);
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
        params.search = debouncedSearchQuery.trim();
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

    } catch (err) {
      console.error('Error fetching entries:', err);
      setError('Failed to load entries');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, sortBy, sortDirection, debouncedSearchQuery, languageFilter, typeFilter, entries.length]);

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

  // Reset to page 1 when search or filters change
  useEffect(() => {
    if (currentPage > 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchQuery, languageFilter, typeFilter, sortBy, sortDirection]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection(column === 'primary_name' ? 'asc' : 'desc');
    }
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle filters
  const clearFilters = () => {
    setSearchQuery('');
    setLanguageFilter('');
    setTypeFilter('');
    setCurrentPage(1);
  };

  // Get sort icon
  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortDirection === 'asc' ?
      <ChevronUpIcon className="h-4 w-4 ml-1" /> :
      <ChevronDownIcon className="h-4 w-4 ml-1" />;
  };

  if (loading && entries.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={logout} />
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" message="Loading entries..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={logout} />
        <div className="flex items-center justify-center h-64">
          <ErrorMessage message={error} />
        </div>
      </div>
    );
  }

  // Calculate pagination info
  const startEntry = (currentPage - 1) * pageSize + 1;
  const endEntry = Math.min(currentPage * pageSize, totalEntries);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={logout} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {t('entries.title')}
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              Browse all {totalEntries} entries in our ancient lexicon database
            </p>

            {/* Results info */}
            <div className="text-sm text-gray-500">
              {debouncedSearchQuery || languageFilter || typeFilter ? (
                <>
                  Showing {totalEntries} result{totalEntries !== 1 ? 's' : ''}
                  {debouncedSearchQuery && (
                    <span className="ml-2 px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs">
                      &quot;{debouncedSearchQuery}&quot;
                    </span>
                  )}
                </>
              ) : (
                `Showing ${startEntry} to ${endEntry} of ${totalEntries} entries`
              )}
            </div>
          </div>

          {/* Search and filter bar */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <AutoSearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  loading={searchLoading}
                  placeholder={t('landing.searchPlaceholder')}
                />
              </div>

              {/* Language filter */}
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

              {/* Type filter */}
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

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => handleSort(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
              >
                {Object.entries(SORT_OPTIONS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>

              {(searchQuery || languageFilter || typeFilter) && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Loading overlay for search */}
          {searchLoading && entries.length > 0 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center space-x-2 text-amber-700">
                <div className="animate-spin h-4 w-4 border-2 border-amber-300 border-t-amber-600 rounded-full"></div>
                <span className="text-sm font-medium">Searching...</span>
              </div>
            </div>
          )}

          {/* Entries grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => (
              <RecentItem
                key={entry.id}
                entry={entry}
                showDate={sortBy === 'updated_at' || sortBy === 'created_at'}
              />
            ))}
          </div>

          {entries.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No entries found</p>
              {(searchQuery || languageFilter || typeFilter) && (
                <p className="text-gray-400 mt-2">Try different keywords or clear your filters</p>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {startEntry} to {endEntry} of {totalEntries} entries
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage <= 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  First
                </button>

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

                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
