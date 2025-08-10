'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { EntryWithTranslations, Translation } from "@/app/types/entries";
import Badge from "../ui/badge";
import { formatDate } from '@/lib/utils';
import { useToast } from '@/lib/context/ToastContext';

interface RecentItemProps {
  entry: EntryWithTranslations;
  type?: 'entry' | 'translation' | 'comment';
  showDate?: boolean;
}

export default function RecentItem({ entry, type = 'entry', showDate = true }: RecentItemProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { success, error } = useToast();
  const t = useTranslations();

  const copyToClipboard = async (text: string, translationId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(translationId);
      success(
        t('clipboard.copied'),
        t('clipboard.copiedMessage', { text: text }),
        2000
      );
      setTimeout(() => setCopiedId(null), 1000); // Reset visual feedback after 1 second
    } catch (err) {
      console.error('Failed to copy text: ', err);
      error('Copy Failed', 'Unable to copy to clipboard');
    }
  };
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
          {entry.original_script && <span className="text-zinc-800">{entry.original_script}</span>}
          {entry.alternative_names && entry.alternative_names.length > 0 && (
            <span className="text-gray-500 text-sm">
              ({entry.alternative_names.join(', ')})
            </span>
          )}
        </div>
        {showDate && (
          <div className="text-sm text-gray-500">
            {formatDate(entry.updated_at)}
          </div>
        )}
      </div>
      {type === 'entry' && (
        <p className="text-gray-600 text-sm mt-1">{entry.definition}</p>
      )}



      <div className="text-sm text-gray-700">
        {displayed_translations.map((translation, index) => (
          <span key={translation.id} className="inline-block mr-2 mb-1">
            {length > 1 && <span className="font-semibold text-xs mr-1">{index + 1}:</span>}
            <span 
              onClick={() => copyToClipboard(translation.translated_name, translation.id)}
              className={`px-2 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors duration-200 ${
                copiedId === translation.id 
                  ? 'bg-green-200 text-green-800' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
              title="Click to copy"
            >
              {translation.translated_name}
            </span>
            {translation.notes && <span className="text-xs text-gray-500 ml-1">: {translation.notes}</span>}
            {(translation.upvotes > 0 || translation.downvotes > 0) && (
              <span className="ml-1 text-xs text-gray-500">
                {translation.upvotes > 0 && (
                  <span className="text-green-600">↑{translation.upvotes}</span>
                )}
                {translation.downvotes > 0 && (
                  <span className="text-red-600 ml-1">↓{translation.downvotes}</span>
                )}
              </span>
            )}
          </span>
        ))}
        {length > 5 && (
          <span className="text-xs text-gray-500 px-2 py-1">
            +{length - 5} more
          </span>
        )}
      </div>
    </div >


  )
}
