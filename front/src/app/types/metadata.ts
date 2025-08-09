import { Entry, EntryWithTranslations } from './entries';
import { TranslationWithComment } from './comments';

export interface EntryMetadata {
  total_entries: number;
  newest_updated_entries: Entry[];
  entries_with_newest_translations: EntryWithTranslations[];
  translations_with_newest_comments: TranslationWithComment[];
}