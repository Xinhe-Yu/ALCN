'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usersService } from '@/lib/services';
import type { UserMetadata } from '@/lib/services/users';
import { useAuth } from '@/lib/context/AuthContext';
import { MagnifyingGlassIcon, ClockIcon, ChatBubbleLeftIcon, DocumentTextIcon, LanguageIcon, BookOpenIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import Navbar from '@/components/ui/navbar';
import Sidebar from '@/components/ui/sidebar';
import LoadingSpinner from '@/components/ui/loading-spinner';
import ErrorMessage from '@/components/ui/error-message';
import StatCard from '@/components/ui/stat-card';
import EntriesDataTable from '@/components/entries/entries-data-table';
import Badge from '@/components/ui/badge';

export default function DashboardPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const t = useTranslations();
  const [userMetadata, setUserMetadata] = useState<UserMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('general');
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
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-sm text-gray-600">{translation.language_code}</span>
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
    </div>
  );
}
