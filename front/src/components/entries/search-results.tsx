'use client';

import { useTranslations } from 'next-intl';
import type { EntryWithTranslations } from '@/app/types';
import EntryItem from './entry-item';
import LoadingSpinner from '../ui/loading-spinner';

interface SearchResultsProps {
  results: EntryWithTranslations[];
  loading: boolean;
  query: string;
}

export default function SearchResults({ results, loading, query }: SearchResultsProps) {
  const t = useTranslations();
  if (loading) {
    return (
      <LoadingSpinner size="md" message={`${t('searchResults.searching')} "${query}"...`} />
    );
  }

  if (!query.trim()) {
    return null;
  }

  if (results.length === 0) {
    return (
      <div className="text-center mb-12">
        <p className="text-gray-500">{t('searchResults.noResults')} &ldquo;{query}&rdquo;</p>
        <p className="text-sm text-gray-400 mt-1">{t('searchResults.tryDifferent')}</p>
      </div>
    );
  }

  return (
    <div className="mb-12 w-168 bg-white mx-auto p-5 rounded-lg">
      <p className="text-xs text-gray-500 mb-1 text-start w-full max-w-3xl mx-auto">
        {t('searchResults.foundResults', { count: results.length })}
      </p>
      <div className="space-y-2">
        {results.map((entry) => (
          <EntryItem
            key={entry.id}
            entry={entry}
          />
        ))}
      </div>
    </div>
  );
}
