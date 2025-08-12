'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usersService, entriesService, translationsService } from '@/lib/services';
import type { UserMetadata } from '@/lib/services/users';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { DocumentTextIcon, LanguageIcon, BookOpenIcon, ArrowTrendingUpIcon, PlusIcon } from '@heroicons/react/24/outline';
import Navbar from '@/components/ui/navbar';
import Sidebar from '@/components/ui/sidebar';
import LoadingSpinner from '@/components/ui/loading-spinner';
import ErrorMessage from '@/components/ui/error-message';
import StatCard from '@/components/ui/stat-card';
import EntriesDataTable from '@/components/entries/entries-data-table';
import Badge from '@/components/ui/badge';
import EntryForm, { type EntryFormData } from '@/components/forms/entry-form';
import TranslationAddForm, { type TranslationCreateData } from '@/components/forms/translation-add-form';

export default function DashboardPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const { success, confirm } = useToast();
  const t = useTranslations();
  const [userMetadata, setUserMetadata] = useState<UserMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [showCreateEntryModal, setShowCreateEntryModal] = useState(false);
  const [showCreateTranslationModal, setShowCreateTranslationModal] = useState(false);
  const [createdEntry, setCreatedEntry] = useState<{ id: string; primary_name: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to initialize
    if (authLoading) return;

    // Redirect if not authenticated
    if (!user) {
      router.push('/auth');
      return;
    }

    const fetchData = async () => {
      try {
        const response = await usersService.getCurrentUserMetadata();
        setUserMetadata(response);
      } catch {
        setError(t('dashboard.errors.failedToLoad'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading, user, router, t]);

  const handleCreateEntry = async (data: EntryFormData | Partial<EntryFormData>) => {
    try {
      // Ensure required fields are present for create mode
      if (!data.primary_name || !data.language_code) {
        throw new Error('Required fields are missing');
      }

      // Transform EntryFormData to CreateEntryRequest format
      const createRequest = {
        primary_name: data.primary_name,
        description: data.definition,
        language_code: data.language_code,
        entry_type: data.entry_type ?? null, // Convert undefined to null
      };
      const createdEntryData = await entriesService.createEntry(createRequest);
      setShowCreateEntryModal(false);

      // Store the created entry for potential translation creation
      setCreatedEntry({
        id: createdEntryData.id,
        primary_name: createdEntryData.primary_name
      });

      // Show success message first
      success('Entry created successfully!', `"${createdEntryData.primary_name}" has been added to the collection.`);

      // Ask if user wants to create a translation
      setTimeout(async () => {
        const wantsTranslation = await confirm({
          title: 'Create Translation?',
          message: `Would you like to create a translation for "${createdEntryData.primary_name}"?`,
          confirmText: 'Yes, Add Translation',
          cancelText: 'Not Now'
        });

        if (wantsTranslation) {
          setShowCreateTranslationModal(true);
        } else {
          setCreatedEntry(null);
        }
      }, 1000);

      // Refresh user metadata to update statistics
      const response = await usersService.getCurrentUserMetadata();
      setUserMetadata(response);
    } catch (err) {
      console.error('Failed to create entry:', err);
      throw err; // Let EntryForm handle the error display
    }
  };

  const handleCreateTranslation = async (data: TranslationCreateData) => {
    try {
      await translationsService.createTranslation(data);
      setShowCreateTranslationModal(false);
      setCreatedEntry(null);

      // Refresh user metadata to update statistics
      const response = await usersService.getCurrentUserMetadata();
      setUserMetadata(response);
    } catch (err) {
      console.error('Failed to create translation:', err);
      throw err; // Let TranslationAddForm handle the error display
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorMessage
          message={error}
          action={{
            label: t('dashboard.errors.backToLogin'),
            onClick: logout
          }}
        />
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="p-6">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Statistics</h2>
              <p className="text-gray-600">Your contributions and activity overview</p>
            </div>

            {userMetadata && (
              <>
                {/* Contribution Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                  <StatCard
                    title="Entries Created"
                    value={userMetadata.entries_created}
                    icon={<DocumentTextIcon className="h-6 w-6 text-green-500" />}
                  />
                  <StatCard
                    title="Translations Created"
                    value={userMetadata.translations_created}
                    icon={<LanguageIcon className="h-6 w-6 text-blue-500" />}
                  />
                  <StatCard
                    title="Entries Updated"
                    value={userMetadata.entries_updated}
                    icon={<DocumentTextIcon className="h-6 w-6 text-orange-500" />}
                  />
                  <StatCard
                    title="Translations Updated"
                    value={userMetadata.translations_updated}
                    icon={<LanguageIcon className="h-6 w-6 text-purple-500" />}
                  />
                  <StatCard
                    title="Recent Entries (30 days)"
                    value={userMetadata.recent_activity.entries_created_last_30_days}
                    icon={<ArrowTrendingUpIcon className="h-6 w-6 text-green-400" />}
                  />
                  <StatCard
                    title="Recent Translations (30 days)"
                    value={userMetadata.recent_activity.translations_created_last_30_days}
                    icon={<ArrowTrendingUpIcon className="h-6 w-6 text-blue-400" />}
                  />

                  {/* Create New Entry Card */}
                  <div
                    onClick={() => setShowCreateEntryModal(true)}
                    className="bg-white p-6 rounded-lg border border-gray-200 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">
                          Create New Entry
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Add a new entry to the collection
                        </p>
                      </div>
                      <PlusIcon className="h-8 w-8 text-amber-500 group-hover:text-amber-600 transition-colors" />
                    </div>
                  </div>
                </div>

                {/* Translated Books */}
                {userMetadata.translated_books.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <BookOpenIcon className="h-5 w-5 mr-2 text-amber-500" />
                      Your Translated Books ({userMetadata.translated_books.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {userMetadata.translated_books.map((book) => (
                        <div key={book.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <h4 className="font-semibold text-gray-900 mb-2 leading-relaxed">{book.title}
                            {book.publication_year && <span className="text-sm text-gray-600 mb-1"> ({book.publication_year}) </span>}
                            <Badge code={book.language_code} />
                          </h4>
                          {book.author && <p className="text-sm text-gray-600 mb-1 font-serif">by {book.author}</p>}
                          {book.description && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{book.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Activity Lists */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Recent Entries */}
                  {userMetadata.recent_entries.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Entries</h3>
                      <div className="space-y-3">
                        {userMetadata.recent_entries.map((entry) => (

                          <div key={entry.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                            <h4 className="font-medium text-gray-900">{entry.primary_name}</h4>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-sm text-gray-600">{entry.language_code}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(entry.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Translations */}
                  {userMetadata.recent_translations.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Translations</h3>
                      <div className="space-y-3">
                        {userMetadata.recent_translations.map((translation) => (
                          <div key={translation.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                            <h4 className="font-medium text-gray-900">{translation.translated_name}</h4>
                            <div className="flex items-center justify-end mt-1">
                              <span className="text-xs text-gray-500">
                                {new Date(translation.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        );

      case 'entries':
        return <EntriesDataTable />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <Navbar user={user} onLogout={logout} />

      <div className="flex flex-1">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="flex-1">
          {renderTabContent()}
        </main>
      </div>

      {/* Create Entry Modal */}
      {showCreateEntryModal && (
        <EntryForm
          mode="create"
          onSave={handleCreateEntry}
          onCancel={() => setShowCreateEntryModal(false)}
        />
      )}

      {/* Create Translation Modal */}
      {showCreateTranslationModal && createdEntry && (
        <TranslationAddForm
          entryId={createdEntry.id}
          entryName={createdEntry.primary_name}
          onSave={handleCreateTranslation}
          onCancel={() => {
            setShowCreateTranslationModal(false);
            setCreatedEntry(null);
          }}
        />
      )}
    </div>
  );
}
