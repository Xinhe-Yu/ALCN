export interface Entry {
  id: string;
  primary_name: string;
  language_code: string;
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

export interface EntrySearchParams {
  skip?: number;
  limit?: number;
  search?: string;
  language_code?: string;
  entry_type?: string;
}

export interface TrigramSearchParams {
  skip?: number;
  limit?: number;
  threshold?: number;
}