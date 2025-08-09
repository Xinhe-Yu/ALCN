'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { entriesService } from '@/lib/services';
import type { EntryMetadata } from '@/app/types';
import { useAuth } from '@/lib/context/AuthContext';
import { MagnifyingGlassIcon, ClockIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import Navbar from '@/components/ui/navbar';
import LoadingSpinner from '@/components/ui/loading-spinner';
import ErrorMessage from '@/components/ui/error-message';

export default function DashboardPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const [metadata, setMetadata] = useState<EntryMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
        const metadataResponse = await entriesService.getMetadata();
        setMetadata(metadataResponse);
      } catch {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, router]);


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
            label: "Back to Login",
            onClick: logout
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={logout} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">User Dashboard</h2>
            <p className="text-gray-600">Your personalized view of dictionary entries and activity</p>
          </div>

          {metadata && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Entries
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {metadata.total_entries.toLocaleString()}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ClockIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Recent Updates
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {metadata.newest_updated_entries.length}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ChatBubbleLeftIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Recent Comments
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {metadata.translations_with_newest_comments.length}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Recently Updated Entries
                    </h3>
                    <div className="space-y-3">
                      {metadata.newest_updated_entries.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div>
                            <p className="font-medium text-gray-900">{entry.primary_name}</p>
                            <p className="text-sm text-gray-500">
                              {entry.language_code} • {entry.entry_type || 'General'}
                            </p>
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(entry.updated_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Recent Translations
                    </h3>
                    <div className="space-y-3">
                      {metadata.entries_with_newest_translations.slice(0, 5).map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div>
                            <p className="font-medium text-gray-900">{entry.primary_name}</p>
                            <p className="text-sm text-gray-500">
                              {entry.translations.length} translation{entry.translations.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {entry.translations.map((translation) => (
                              <span key={translation.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                {translation.language_code}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {metadata.translations_with_newest_comments.length > 0 && (
                <div className="mt-6 bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Recent Comments
                    </h3>
                    <div className="space-y-3">
                      {metadata.translations_with_newest_comments.map((translation) => (
                        <div key={translation.id} className="border-l-4 border-amber-400 pl-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">{translation.translated_name}</p>
                              <p className="text-sm text-gray-500 mb-2">{translation.language_code}</p>
                              {translation.newest_comment && (
                                <p className="text-sm text-gray-600">{translation.newest_comment.content}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <span className="text-green-600">↑{translation.upvotes}</span>
                              <span className="text-red-600">↓{translation.downvotes}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
