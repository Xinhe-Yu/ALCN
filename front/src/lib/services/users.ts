import { api } from '../interceptors';

export interface UserMetadata {
  entries_created: number;
  entries_updated: number;
  translations_created: number;
  translations_updated: number;
  translated_books: TranslatedBook[];
  recent_activity: {
    entries_created_last_30_days: number;
    translations_created_last_30_days: number;
  };
  recent_entries: RecentEntry[];
  recent_translations: RecentTranslation[];
}

export interface TranslatedBook {
  id: string;
  title: string;
  author?: string;
  publisher?: string;
  publication_year?: number;
  language_code: string;
  isbn?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface RecentEntry {
  id: string;
  primary_name: string;
  language_code: string;
  entry_type?: string;
  created_at: string;
  updated_at: string;
}

export interface RecentTranslation {
  id: string;
  translated_name: string;
  language_code: string;
  entry_id: string;
  created_at: string;
  updated_at: string;
}

export const usersService = {
  async getCurrentUserMetadata(): Promise<UserMetadata> {
    const response = await api.get<UserMetadata>('/api/v1/users/me/metadata');
    return response.data;
  },

  async getUserMetadata(userId: string): Promise<UserMetadata> {
    const response = await api.get<UserMetadata>(`/api/v1/users/${userId}/metadata`);
    return response.data;
  },
};