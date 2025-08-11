import type { EntryWithTranslations } from '@/app/types';
import EntryItem from './entry-item';

interface EntryListProps {
  title: string;
  entries: EntryWithTranslations[];
}

export default function EntryList({ title, entries }: EntryListProps) {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          {title}
        </h3>
        <div className="space-y-2">
          {entries.map((entry) => (
            <EntryItem
              key={entry.id}
              entry={entry}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
