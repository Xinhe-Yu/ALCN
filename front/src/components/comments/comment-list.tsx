import type { EntryWithComment } from '@/app/types';
import Badge from '../ui/badge';
import { MdToHtml, formatDate } from '@/lib/utils';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

interface CommentListProps {
  title: string;
  entries: EntryWithComment[];
  onEntryClick?: (entry: EntryWithComment) => void;
}

export default function CommentList({ title, entries, onEntryClick }: CommentListProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center gap-2">
          <ChatBubbleLeftIcon className="h-5 w-5 text-amber-600" />
          {title}
        </h3>
        <div className="space-y-3">
          {entries.map((entry) => (
            <div 
              key={entry.id} 
              className="bg-white border border-transparent transition-all duration-150 hover:shadow-sm cursor-pointer"
              onClick={() => onEntryClick?.(entry)}
            >
              <div className="border-l-4 border-amber-400 px-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    {/* Comment - Primary focus with emphasis */}
                    {entry.newest_comment && (
                      <div className="mb-2">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="font-sans font-semibold text-amber-700 text-sm">
                            {entry.newest_comment.user?.username}
                          </span>
                          <span className="text-gray-400 text-xs">•</span>
                          <span className="text-gray-500 text-xs font-mono">
                            {formatDate(entry.newest_comment.created_at)}
                          </span>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-md p-2.5">
                          <div
                            className="text-sm font-serif text-gray-800 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: MdToHtml(entry.newest_comment.content) }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Entry information - Secondary, more subdued */}
                    <div className="flex items-center flex-wrap gap-1.5 mb-0.5">
                      <h4 className="font-serif font-medium text-gray-700 text-sm leading-tight">
                        {entry.primary_name}
                      </h4>
                      {entry.original_script && (
                        <span className="font-serif italic text-gray-600 text-xs">
                          {entry.original_script}
                        </span>
                      )}
                      <Badge code={entry.language_code} />
                      {entry.entry_type && <Badge code={entry.entry_type} type="type" />}
                    </div>

                    {/* Definition - Compact and subdued */}
                    {entry.definition && (
                      <p className="text-gray-600 text-xs font-serif leading-snug line-clamp-2">
                        {entry.definition}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
