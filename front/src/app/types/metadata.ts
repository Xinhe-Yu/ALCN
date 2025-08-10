import { EntryWithTranslations } from './entries';
import { EntryWithComment } from './comments';

export interface EntryMetadata {
  total_entries: number;
  recently_updated_count: number;
  newest_updated_entries: EntryWithTranslations[];
  entries_with_newest_translations: EntryWithTranslations[];
  entries_with_newest_comments: EntryWithComment[];
}
