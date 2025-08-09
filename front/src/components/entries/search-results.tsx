import type { EntryWithTranslations } from '@/app/types';
import SearchResultItem from './search-result-item';
import LoadingSpinner from '../ui/loading-spinner';

interface SearchResultsProps {
  results: EntryWithTranslations[];
  loading: boolean;
  query: string;
}

export default function SearchResults({ results, loading, query }: SearchResultsProps) {
  if (loading) {
    return (
      <LoadingSpinner size="md" message={`Searching for "${query}"...`} />
    );
  }

  if (!query.trim()) {
    return null;
  }

  if (results.length === 0) {
    return (
      <div className="text-center mb-12">
        <p className="text-gray-500">No results found for &ldquo;{query}&rdquo;</p>
        <p className="text-sm text-gray-400 mt-1">Try different keywords or check your spelling</p>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <p className="text-xs text-gray-500 mb-1 text-start w-full max-w-3xl mx-auto">
        Found {results.length} result{results.length !== 1 ? 's' : ''}
      </p>
      <div>
        {results.map((entry, index) => (
          <SearchResultItem
            key={entry.id}
            entry={entry}
            isFirst={index === 0}
            isLast={index === results.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
