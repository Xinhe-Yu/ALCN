import type { EntryWithTranslations } from '@/app/types';
import Badge from '../ui/badge';

interface EntryCardProps {
  entry: EntryWithTranslations;
}

export default function EntryCard({ entry }: EntryCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-lg font-semibold text-gray-900">{entry.primary_name}</h4>
        <Badge code={entry.language_code} />
      </div>

      {entry.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{entry.description}</p>
      )}

      {entry.translations && entry.translations.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500">Translations:</p>
          <div className="flex flex-wrap gap-2">
            {entry.translations.slice(0, 3).map((translation) => (
              <div key={translation.id} className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {translation.translated_name}
                </span>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <span className="text-green-600">↑{translation.upvotes}</span>
                  <span className="text-red-600">↓{translation.downvotes}</span>
                </div>
              </div>
            ))}
          </div>
          {entry.translations.length > 3 && (
            <p className="text-xs text-gray-500">+{entry.translations.length - 3} more translations</p>
          )}
        </div>
      )}
    </div>
  );
}
