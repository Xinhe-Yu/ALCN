'use client';

import { useEffect, useState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { entriesService } from '@/lib/services';
import type { EntryMetadata, EntryWithTranslations, EntryWithComment } from '@/app/types';
import { useAuth } from '@/lib/context/AuthContext';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { MagnifyingGlassIcon, ClockIcon, ChatBubbleLeftIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

import Navbar from '@/components/ui/navbar';
import AutoSearchBar from '@/components/ui/auto-search-bar';
import LoadingSpinner from '@/components/ui/loading-spinner';
import ErrorMessage from '@/components/ui/error-message';
import StatCard from '@/components/ui/stat-card';
import SearchResults from '@/components/entries/search-results';
import EntryList from '@/components/entries/entry-list';
import CommentList from '@/components/comments/comment-list';
import EntryModal from '@/components/ui/entry-modal';

export default function Home() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const t = useTranslations();
  const [metadata, setMetadata] = useState<EntryMetadata | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<EntryWithTranslations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<EntryWithTranslations | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Debounce search query with 300ms delay
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Load metadata on initial page load
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const metadataResponse = await entriesService.getMetadata();
        setMetadata(metadataResponse);
      } catch (err) {
        setError(t('landing.errors.failedToLoad'));
        console.error('Failed to fetch metadata:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        // setPagination({
        //   total: results.total,
        //   skip: results.skip,
        //   limit: results.limit,
        //   page: results.page,
        //   pages: results.pages,
        // });
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

  // Handle entry click from comment list
  const handleEntryClick = async (entryWithComment: EntryWithComment) => {
    try {
      // Fetch full entry details
      const fullEntry = await entriesService.getEntry(entryWithComment.id);
      setSelectedEntry(fullEntry);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch entry details:', err);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEntry(null);
  };


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
      <Navbar user={user} onLogout={logout} onHomeClick={() => setSearchQuery('')} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Hero Section with Search */}
          <div className="text-center mb-2">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t('landing.title')}
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              {t('landing.subtitle')}
            </p>

            <div className="max-w-2xl mx-auto">
              <AutoSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                loading={searchLoading}
                placeholder={t('landing.quickSearchPlaceholder')}
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 mt-8">
                {/* Detailed Search Button */}
                <div className="bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 flex items-center">
                  <button
                    onClick={() => {
                      startTransition(() => {
                        router.replace('/list');
                      });
                    }}
                    className="flex items-center space-x-2 cursor-pointer w-full h-full"
                  >
                    <div className="p-5">
                      <MagnifyingGlassIcon className="h-5 w-5" />
                    </div>
                    <span>{t('landing.stats.detailedSearch')}</span>
                  </button>

                </div>
                <StatCard
                  title={t('landing.stats.totalEntries')}
                  value={metadata.total_entries}
                  icon={<AdjustmentsHorizontalIcon className="h-6 w-6 text-orange-500" />}
                />
                <StatCard
                  title={t('landing.stats.recentlyUpdated')}
                  value={metadata.recently_updated_count}
                  icon={<ClockIcon className="h-6 w-6 text-amber-500" />}
                />
                <StatCard
                  title={t('landing.stats.activeDiscussions')}
                  value={metadata.entries_with_newest_comments.length}
                  icon={<ChatBubbleLeftIcon className="h-6 w-6 text-pink-400" />}
                />
              </div>



              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EntryList
                  title={t('landing.sections.recentlyUpdated')}
                  entries={metadata.newest_updated_entries}
                />
                {/* <TranslationList
                  title={t('landing.sections.recentTranslations')}
                  entries={metadata.entries_with_newest_translations}
                /> */}
                <CommentList
                  title={t('landing.sections.recentDiscussions')}
                  entries={metadata.entries_with_newest_comments}
                  onEntryClick={handleEntryClick}
                />
              </div>

            </>
          )}
        </div>
      </main>

      {/* Entry Modal */}
      <EntryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        entry={selectedEntry}
      />
    </div >
  );
}
