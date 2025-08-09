export interface Comment {
  id: string;
  content: string;
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