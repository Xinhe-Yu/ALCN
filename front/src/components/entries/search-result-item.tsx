import type { EntryWithTranslations } from '@/app/types';
import Badge from '../ui/badge';

interface SearchResultItemProps {
  entry: EntryWithTranslations;
  isFirst?: boolean;
  isLast?: boolean;
}

export default function SearchResultItem({ entry, isFirst = false, isLast = false }: SearchResultItemProps) {
  const getBorderRadiusClass = () => {
    if (isFirst && isLast) {
      return 'rounded-lg';
    } else if (isFirst) {
      return 'rounded-t-lg';
    } else if (isLast) {
      return 'rounded-b-lg';
    } else {
      return '';
    }
  };

  const borderRadiusClass = getBorderRadiusClass();

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className={`bg-white border border-gray-300 p-2 ${borderRadiusClass} ${!isFirst ? 'border-t-0' : ''}`}>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 mt-1">
            <h4 className="text-lg font-semibold text-gray-900">{entry.primary_name}</h4>
            <Badge code={entry.language_code} />
            {entry.entry_type && (
              <Badge code={entry.entry_type} type="type" />
            )}
          </div>
        </div>

        {entry.definition && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{entry.definition}</p>
        )}

        {entry.translations && entry.translations.length > 0 && (
          <div className="space-y-2">
            {/* <p className="text-sm font-medium text-gray-500">
              {entry.translations.length} translation{entry.translations.length !== 1 ? 's' : ''}:
            </p> */}
            <div className="flex flex-wrap gap-2">
              {entry.translations.slice(0, 5).map((translation, index) => (
                <div key={translation.id} className="flex items-center gap-1">
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                    {entry.translations.length > 1 && <span className="font-semibold">{index + 1}:</span>}
                    <span>{translation.translated_name}</span>
                  </span>
                  {(translation.upvotes > 0 || translation.downvotes > 0) && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      {translation.upvotes > 0 && (
                        <span className="text-green-600">↑{translation.upvotes}</span>
                      )}
                      {translation.downvotes > 0 && (
                        <span className="text-red-600">↓{translation.downvotes}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {entry.translations.length > 5 && (
                <span className="text-xs text-gray-500 px-2 py-1">
                  +{entry.translations.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
