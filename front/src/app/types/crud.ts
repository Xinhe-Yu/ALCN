// CRUD operations and pagination interfaces

// Language codes supported in the system
export type LanguageCode = 'ag' | 'lat' | 'en' | 'de' | 'fr' | 'tu';

// Language code display names
export const LANGUAGE_OPTIONS: Record<LanguageCode, string> = {
  ag: 'Ancient Greek',
  lat: 'Latin',
  en: 'English',
  de: 'German',
  fr: 'French',
  tu: 'Turkish',
};

// Entry types
export type EntryType = 'name' | 'place' | 'term' | 'concept' | 'title' | 'other';

export const ENTRY_TYPE_OPTIONS: Record<EntryType, string> = {
  name: 'Personal Name',
  place: 'Place Name',
  term: 'Term',
  concept: 'Concept',
  title: 'Title',
  other: 'Other',
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
  id: number;
  primary_name: string;
  description?: string;
  language_code: LanguageCode;
  entry_type?: EntryType;
  created_at: string;
  updated_at: string;
  // First translation data
  first_translation?: {
    id: number;
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
  entry_type?: EntryType;
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
  entry_type?: EntryType;
}

export interface UpdateEntryRequest {
  id: number;
  primary_name?: string;
  description?: string;
  language_code?: LanguageCode;
  entry_type?: EntryType;
}

export interface BulkUpdateRequest {
  entry_ids: number[];
  updates: {
    language_code?: LanguageCode;
    entry_type?: EntryType;
  };
}

export interface DeleteEntryRequest {
  id: number;
}

// Selection state for table rows
export interface SelectionState {
  selectedIds: Set<number>;
  isAllSelected: boolean;
  isIndeterminate: boolean;
}

// Filter state
export interface FilterState {
  search: string;
  language_code?: LanguageCode;
  entry_type?: EntryType;
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