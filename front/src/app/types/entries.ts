export interface Entry {
  id: string;
  primary_name: string;
  language_code: string;
  original_name?: string;
  alternative_names?: string[];
  other_language_codes: string[];
  entry_type?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Translation {
  id: string;
  entry_id: string;
  language_code: string;
  translated_name: string;
  notes?: string;
  is_preferred: boolean;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
}

export interface EntryWithTranslations extends Entry {
  translations: Translation[];
}

export interface Pagination {
  total: number;
  skip: number;
  limit: number;
  page: number;
  pages: number;
}

export interface PaginatedEntries extends Pagination {
  items: EntryWithTranslations[];
}

export interface EntrySearchParams {
  skip?: number;
  limit?: number;
  search?: string;
  fuzzy_search?: string;
  language_code?: string;
  entry_type?: string;
  sorted_by?: string;
  sort_direction?: 'asc' | 'desc';
}

export interface TrigramSearchParams {
  skip?: number;
  limit?: number;
  threshold?: number;
}
