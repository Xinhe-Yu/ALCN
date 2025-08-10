// CRUD operations and pagination interfaces

// Language codes supported in the system
export type LanguageCode = 'ag' | 'lat' | 'en' | 'de' | 'fr' | 'tu' | 'gr';

// Language code display names
export const LANGUAGE_OPTIONS: Record<LanguageCode, string> = {
  ag: 'Ancient Greek',
  lat: 'Latin',
  en: 'English',
  de: 'German',
  fr: 'French',
  tu: 'Turkish',
  gr: 'Greek',
};

// Entry types
export type EntryType = 'term' | 'personal_name' | 'place_name' | 'artwork_title' | 'concept';
export const ENTRY_TYPE_OPTIONS: Record<EntryType, string> = {
  personal_name: 'Personal Name',
  place_name: 'Place Name',
  term: 'Term',
  concept: 'Concept',
  artwork_title: 'Artwork Title',
};

// Pagination configuration
export interface PaginationConfig {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
export type PageSize = typeof PAGE_SIZE_OPTIONS[number];

// Sorting configuration
export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

// Entry with first translation for table display
export interface EntryTableRow {
  id: string;
  primary_name: string;
  description?: string;
  language_code: LanguageCode;
  entry_type: EntryType | null; // null represents "other"
  created_at: string;
  updated_at: string;
  // First translation data
  first_translation?: {
    id: string;
    translated_name: string;
    language_code: LanguageCode;
    upvotes: number;
    downvotes: number;
  };
  translation_count: number;
}

// API request interfaces
export interface GetEntriesRequest {
  page?: number;
  limit?: PageSize;
  search?: string;
  language_code?: LanguageCode;
  entry_type?: EntryType | null; // null for any type
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}

export interface GetEntriesResponse {
  entries: EntryTableRow[];
  pagination: PaginationConfig;
}

export interface CreateEntryRequest {
  primary_name: string;
  description?: string;
  language_code: LanguageCode;
  entry_type: EntryType | null; // null for "other"
}

export interface UpdateEntryRequest {
  id: string;
  primary_name?: string;
  original_script?: string;
  language_code?: LanguageCode;
  entry_type?: EntryType | null; // null for "other"
  alternative_names?: string[];
  other_language_codes?: LanguageCode[];
  etymology?: string;
  definition?: string;
  historical_context?: string;
  verification_notes?: string;
}

export interface UpdateTranslationRequest {
  id: string;
  translated_name?: string;
  notes?: string;
}
export type UpdateEntryField = keyof UpdateEntryRequest
export type UpdateTranslationField = keyof UpdateTranslationRequest;

export interface BulkUpdateRequest {
  entry_ids: string[];
  updates: {
    language_code?: LanguageCode;
    entry_type?: EntryType | null; // null for "other"
    is_verified?: boolean;
  };
}

export interface DeleteEntryRequest {
  id: string;
}

// Selection state for table rows
export interface SelectionState {
  selectedIds: Set<string>;
  isAllSelected: boolean;
  isIndeterminate: boolean;
}

// Filter state
export interface FilterState {
  search: string;
  language_code?: LanguageCode;
  entry_type?: EntryType | null; // null for "other"
}

// Table state
export interface TableState {
  data: EntryTableRow[];
  loading: boolean;
  error?: string;
  pagination: PaginationConfig;
  sort: SortConfig;
  selection: SelectionState;
  filters: FilterState;
}
