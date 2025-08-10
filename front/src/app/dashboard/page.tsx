'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { entriesService } from '@/lib/services';
import type { EntryMetadata } from '@/app/types';
import { useAuth } from '@/lib/context/AuthContext';
import { MagnifyingGlassIcon, ClockIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import Navbar from '@/components/ui/navbar';
import Sidebar from '@/components/ui/sidebar';
import LoadingSpinner from '@/components/ui/loading-spinner';
import ErrorMessage from '@/components/ui/error-message';
import StatCard from '@/components/ui/stat-card';
import EntriesDataTable from '@/components/entries/entries-data-table';

export default function DashboardPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const t = useTranslations();
  const [metadata, setMetadata] = useState<EntryMetadata | null>(null);
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
        const metadataResponse = await entriesService.getMetadata();
        setMetadata(metadataResponse);
      } catch {
        setError(t('dashboard.errors.failedToLoad'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, router, t]);


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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('dashboard.general.title')}</h2>
              <p className="text-gray-600">{t('dashboard.general.subtitle')}</p>
            </div>

            {metadata && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                  title={t('landing.stats.totalEntries')}
                  value={metadata.total_entries}
                  icon={<MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />}
                />
                <StatCard
                  title={t('landing.stats.recentlyUpdated')}
                  value={metadata.recently_updated_count}
                  icon={<ClockIcon className="h-6 w-6 text-blue-400" />}
                />
                <StatCard
                  title={t('landing.stats.activeDiscussions')}
                  value={metadata.entries_with_newest_comments.length}
                  icon={<ChatBubbleLeftIcon className="h-6 w-6 text-amber-400" />}
                />
              </div>
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
