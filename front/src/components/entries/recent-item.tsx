import { EntryWithTranslations, Translation } from "@/app/types/entries";
import Badge from "../ui/badge";
import { formatDate } from '@/lib/utils';

interface RecentItemProps {
  entry: EntryWithTranslations;
  type?: 'entry' | 'translation' | 'comment';
}

export default function RecentItem({ entry, type = 'entry' }: RecentItemProps) {
  let displayed_translations: Translation[] = [];
  const length = entry.translations.length;

  if (type === 'translation') {
    const latest_translation = entry.translations.reduce<Translation | undefined>((latest, current) => {
      if (!latest) return current;
      return new Date(current.updated_at) > new Date(latest.updated_at) ? current : latest;
    }, undefined);
    displayed_translations = latest_translation ? [latest_translation, ...entry.translations.filter(t => t.id !== latest_translation?.id).slice(0, 4)] : [];
  } else {
    displayed_translations = entry.translations.slice(0, 5);
  }

  return (
    <div key={entry.id} className="items-start p-2 bg-gray-50 rounded-md">
      <div className="flex justify-between">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-900 ps-1">{entry.primary_name}</span>
          <Badge code={entry.language_code} />
          {entry.entry_type && <Badge code={entry.entry_type} type="type" />}
          {entry.original_script}
        </div>
        <div className="text-sm text-gray-500">
          {formatDate(entry.updated_at)}
        </div>
      </div>
      {type === 'entry' && (
        <p className="text-gray-600 text-sm mt-1">{entry.definition}</p>
      )}


      <div className="flex flex-wrap gap-2">
        {displayed_translations.map((translation, index) => (
          <div key={translation.id} className="flex items-center gap-1">
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
              {length > 1 && <span className="font-semibold">{index + 1}:</span>}
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
        {length > 5 && (
          <span className="text-xs text-gray-500 px-2 py-1">
            +{length - 5} more
          </span>
        )}
      </div>
    </div>


  )
}
