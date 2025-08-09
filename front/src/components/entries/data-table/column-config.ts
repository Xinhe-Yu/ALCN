// Column configuration based on Entry and Translation models
export type ColumnConfig = {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  source: 'entry' | 'translation' | 'computed';
};

export const AVAILABLE_COLUMNS: ColumnConfig[] = [
  { key: 'primary_name', label: 'Entry Name', sortable: true, source: 'entry' },
  { key: 'original_script', label: 'Original Script', source: 'entry' },
  { key: 'language_code', label: 'Language', sortable: true, source: 'entry' },
  { key: 'entry_type', label: 'Type', sortable: true, source: 'entry' },
  { key: 'alternative_names', label: 'Alternative Names', source: 'entry' },
  { key: 'etymology', label: 'Etymology', source: 'entry' },
  { key: 'definition', label: 'Definition', source: 'entry' },
  { key: 'historical_context', label: 'Historical Context', source: 'entry' },
  { key: 'is_verified', label: 'Verified', sortable: true, source: 'entry' },
  { key: 'verification_notes', label: 'Verification Notes', source: 'entry' },
  { key: 'first_translation', label: 'First Translation', source: 'computed' },
  { key: 'translation_language', label: 'Translation Language', source: 'translation' },
  { key: 'translation_notes', label: 'Translation Notes', source: 'translation' },
  { key: 'translation_votes', label: 'Votes', source: 'translation' },
  { key: 'created_at', label: 'Created', sortable: true, source: 'entry' },
  { key: 'updated_at', label: 'Updated', sortable: true, source: 'entry' }
];

export const DEFAULT_VISIBLE_COLUMNS = [
  'primary_name',
  'language_code', 
  'entry_type',
  'first_translation',
  'updated_at'
];

export const EDITABLE_FIELDS = [
  'primary_name', 
  'original_script', 
  'language_code', 
  'entry_type', 
  'alternative_names', 
  'etymology', 
  'definition', 
  'historical_context', 
  'verification_notes'
];

export const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
export type PageSize = typeof PAGE_SIZE_OPTIONS[number];