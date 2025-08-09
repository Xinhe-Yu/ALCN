'use client';

import { useEffect, useState } from 'react';
import { entriesService } from '@/lib/services';
import { Pagination, type EntryMetadata, type EntryWithTranslations } from '@/app/types';
import { useAuth } from '@/lib/context/AuthContext';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { MagnifyingGlassIcon, ClockIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

import Navbar from '@/components/ui/navbar';
import AutoSearchBar from '@/components/ui/auto-search-bar';
import LoadingSpinner from '@/components/ui/loading-spinner';
import ErrorMessage from '@/components/ui/error-message';
import StatCard from '@/components/ui/stat-card';
import SearchResults from '@/components/entries/search-results';
import EntryList from '@/components/entries/entry-list';
import TranslationList from '@/components/entries/translation-list';
import CommentList from '@/components/comments/comment-list';

export default function Home() {
  const { user, logout } = useAuth();
  const [metadata, setMetadata] = useState<EntryMetadata | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<EntryWithTranslations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState<Pagination | null>(null);

  // Debounce search query with 300ms delay
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Load metadata on initial page load
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const metadataResponse = await entriesService.getMetadata();
        setMetadata(metadataResponse);
      } catch (err) {
        setError('Failed to load data');
        console.error('Failed to fetch metadata:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, []);

  // Perform search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchQuery.trim()) {
        setSearchResults([]);
        setSearchLoading(false);
        return;
      }

      setSearchLoading(true);
      try {
        const results = await entriesService.getEntries({
          fuzzy_search: debouncedSearchQuery.trim(),
        });
        setSearchResults(results.items);
        setPagination({
          total: results.total,
          skip: results.skip,
          limit: results.limit,
          page: results.page,
          pages: results.pages,
        });
      } catch (err) {
        console.error('Search failed:', err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };

    performSearch();
  }, [debouncedSearchQuery]);

  // Set search loading state when user starts typing
  useEffect(() => {
    if (searchQuery.trim() && searchQuery !== debouncedSearchQuery) {
      setSearchLoading(true);
    }
  }, [searchQuery, debouncedSearchQuery]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={logout} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Hero Section with Search */}
          <div className="text-center mb-2">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ancient Lexicon CN
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              A comprehensive dictionary for Greco-Roman name/term translations
            </p>

            <div className="max-w-2xl mx-auto">
              <AutoSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                loading={searchLoading}
                placeholder="Search ancient terms, names, or places..."
              />
            </div>
          </div>

          <SearchResults
            results={searchResults}
            loading={searchLoading}
            query={debouncedSearchQuery}
          />

          {/* Dashboard Data - Only show when not searching */}
          {metadata && !debouncedSearchQuery.trim() && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-8">
                <StatCard
                  title="Total Entries"
                  value={metadata.total_entries}
                  icon={<MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />}
                />
                <StatCard
                  title="Recent Updates"
                  value={metadata.newest_updated_entries.length}
                  icon={<ClockIcon className="h-6 w-6 text-gray-400" />}
                />
                <StatCard
                  title="Active Discussions"
                  value={metadata.translations_with_newest_comments.length}
                  icon={<ChatBubbleLeftIcon className="h-6 w-6 text-gray-400" />}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EntryList
                  title="Recently Updated Entries"
                  entries={metadata.newest_updated_entries}
                />
                <TranslationList
                  title="Recent Translations"
                  entries={metadata.entries_with_newest_translations}
                />
              </div>

              <CommentList
                title="Recent Discussions"
                translations={metadata.translations_with_newest_comments}
              />
            </>
          )}
        </div>
      </main>
    </div >
  );
}
