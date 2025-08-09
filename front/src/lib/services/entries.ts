import { api } from '../interceptors';
import type { 
  EntryMetadata, 
  EntryWithTranslations, 
  EntrySearchParams, 
  TrigramSearchParams 
} from '@/app/types';

export const entriesService = {
  async getMetadata() {
    const response = await api.get<EntryMetadata>('/api/v1/entries/metadata');
    return response.data;
  },

  async getEntries(params?: EntrySearchParams) {
    const response = await api.get<EntryWithTranslations[]>('/api/v1/entries', { params });
    return response.data;
  },

  async getEntry(id: string) {
    const response = await api.get<EntryWithTranslations>(`/api/v1/entries/${id}`);
    return response.data;
  },

  async searchTrigram(query: string, params?: TrigramSearchParams) {
    const searchParams = { q: query, ...params };
    const response = await api.get<EntryWithTranslations[]>('/api/v1/entries/search/trigram', { 
      params: searchParams 
    });
    return response.data;
  },
};