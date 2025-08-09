import type { TranslationWithComment } from '@/app/types';

interface CommentListProps {
  title: string;
  translations: TranslationWithComment[];
}

export default function CommentList({ title, translations }: CommentListProps) {
  if (translations.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          {title}
        </h3>
        <div className="space-y-3">
          {translations.map((translation) => (
            <div key={translation.id} className="border-l-4 border-amber-400 pl-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">{translation.translated_name}</p>
                  <p className="text-sm text-gray-500 mb-2">{translation.language_code}</p>
                  {translation.newest_comment && (
                    <p className="text-sm text-gray-600">{translation.newest_comment.content}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span className="text-green-600">↑{translation.upvotes}</span>
                  <span className="text-red-600">↓{translation.downvotes}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
