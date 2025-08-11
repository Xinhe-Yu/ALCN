export interface Comment {
  id: string;
  entry_id: string;
  user_id: string;
  parent_comment_id?: string;
  content: string;
  user: {
    id: string;
    username: string;
  };
  is_edited: boolean;
  edit_history?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
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
  translations?: unknown[];
  newest_comment?: Comment;
}
