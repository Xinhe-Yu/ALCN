import type { EntryWithTranslations } from '@/app/types';
import Badge from '../ui/badge';
interface TranslationListProps {
  title: string;
  entries: EntryWithTranslations[];
}

export default function TranslationList({ title, entries }: TranslationListProps) {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          {title}
        </h3>
        <div className="space-y-3">
          {entries.slice(0, 5).map((entry) => (
            <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div>
                <p className="font-medium text-gray-900">{entry.primary_name}</p>
                <p className="text-sm text-gray-500">
                  {entry.translations.length} translation{entry.translations.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {entry.translations.slice(0, 3).map((translation) => (
                  <Badge key={translation.id} code={translation.language_code} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
