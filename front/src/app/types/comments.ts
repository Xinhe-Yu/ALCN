export interface Comment {
  id: string;
  entry_id: string;
  user_id: string;
  parent_comment_id?: string;
  content: string;
  is_edited: boolean;
  edit_history?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TranslationWithComment {
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
  newest_comment?: Comment;
}

export interface EntryWithComment {
  id: string;
  primary_name: string;
  original_script?: string;
  language_code: string;
  entry_type?: string;
  alternative_names?: string[];
  other_language_codes?: string[];
  etymology?: string;
  definition?: string;
  historical_context?: string;
  is_verified: boolean;
  verification_notes?: string;
  created_at: string;
  updated_at: string;
  translations?: any[];
  newest_comment?: Comment;
}