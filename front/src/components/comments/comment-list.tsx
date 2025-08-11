import type { EntryWithComment } from '@/app/types';
import Badge from '../ui/badge';

interface CommentListProps {
  title: string;
  entries: EntryWithComment[];
}

export default function CommentList({ title, entries }: CommentListProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          {title}
        </h3>
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="border-l-4 border-amber-400 pl-4">
              <div className="flex justify-between items-start">
                <div>
                  {entry.newest_comment && (
                    <p className="text-sm text-gray-600 leading-tight">
                      {entry.newest_comment.user?.username}

                      {entry.newest_comment.content}</p>
                  )}
                  <div className="flex items-center space-x-2 mb-1 text-sm">
                    <p className="font-medium text-gray-900">{entry.primary_name}</p>
                    <Badge code={entry.language_code} />
                    {entry.entry_type && <Badge code={entry.entry_type} type="type" />}
                  </div>
                  {entry.definition && (
                    <p className="text-sm text-gray-500 mb-2">{entry.definition}</p>
                  )}

                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
