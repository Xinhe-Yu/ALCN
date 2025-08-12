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
  { key: 'language_code', label: 'Lang', sortable: true, source: 'entry' },
  { key: 'entry_type', label: 'Type', sortable: true, source: 'entry' },
  { key: 'alternative_names', label: 'Alternative Names', source: 'entry' },
  { key: 'etymology', label: 'Etymology', source: 'entry' },
  { key: 'definition', label: 'Definition', source: 'entry' },
  { key: 'historical_context', label: 'Historical Context', source: 'entry' },
  { key: 'is_verified', label: 'Verified', sortable: true, source: 'entry' },
  { key: 'verification_notes', label: 'Verification Notes', source: 'entry' },
  { key: 'first_translation', label: 'Translation', source: 'computed' },
  { key: 'translation_notes', label: 'Translation Notes', source: 'translation' },
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
  'verification_notes',
  'first_translation', // Allow editing the translation name
  'translation_notes'
];

// Entry type colors for visual distinction
export const ENTRY_TYPE_COLORS: Record<string, string> = {
  'term': 'bg-blue-100 text-blue-800 border-blue-200',
  'personal_name': 'bg-green-100 text-green-800 border-green-200',
  'place_name': 'bg-purple-100 text-purple-800 border-purple-200',
  'artwork_title': 'bg-pink-100 text-pink-800 border-pink-200',
  'concept': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  '': 'bg-gray-100 text-gray-600 border-gray-200' // empty/default
};

// Language colors for visual distinction
export const LANGUAGE_COLORS: Record<string, string> = {
  'gr': 'bg-emerald-100 text-emerald-800 border-emerald-200', // Ancient Greek
  'lat': 'bg-amber-100 text-amber-800 border-amber-200',      // Latin
  'en': 'bg-sky-100 text-sky-800 border-sky-200',         // English
  'de': 'bg-red-100 text-red-800 border-red-200',           // German
  'fr': 'bg-indigo-100 text-indigo-800 border-indigo-200',   // French
  'tu': 'bg-rose-100 text-rose-800 border-rose-200',        // Turkish
  'el': 'bg-teal-100 text-teal-800 border-teal-200',        // Modern Greek
  'ar': 'bg-violet-100 text-violet-800 border-violet-200', // Arabic
  'ro': 'bg-cyan-100 text-cyan-800 border-cyan-200',        // Romanian
  'it': 'bg-pink-100 text-pink-800 border-pink-200',        // Italian
  'es': 'bg-yellow-100 text-yellow-800 border-yellow-200',   // Spanish
  '': 'bg-gray-100 text-gray-600 border-gray-200'           // empty/default
};

export const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
export type PageSize = typeof PAGE_SIZE_OPTIONS[number];
