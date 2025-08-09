import type { Entry } from '@/app/types';
import { formatDate } from '@/lib/utils';
import Badge from '../ui/badge';

interface EntryListProps {
  title: string;
  entries: Entry[];
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
            <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">{entry.primary_name}</span>
                <Badge code={entry.language_code} />
                {entry.entry_type && <Badge code={entry.entry_type} type="type" />}
              </div>
              <div className="text-sm text-gray-500">
                {formatDate(entry.updated_at)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
