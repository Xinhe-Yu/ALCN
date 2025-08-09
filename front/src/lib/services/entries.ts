import { api } from '../interceptors';
import type {
  EntryMetadata,
  EntryWithTranslations,
  EntrySearchParams,
  CreateEntryRequest,
  UpdateEntryRequest,
  BulkUpdateRequest,
  DeleteEntryRequest,
  EntryTableRow,
  PaginatedEntries
} from '@/app/types';

export const entriesService = {
  async getMetadata() {
    const response = await api.get<EntryMetadata>('/api/v1/entries/metadata');
    return response.data;
  },

  async getEntries(params?: EntrySearchParams) {
    const response = await api.get<PaginatedEntries>('/api/v1/entries', { params });
    return response.data;
  },

  async getEntry(id: string) {
    const response = await api.get<EntryWithTranslations>(`/api/v1/entries/${id}`);
    return response.data;
  },

  async createEntry(data: CreateEntryRequest) {
    const response = await api.post<EntryTableRow>('/api/v1/entries', data);
    return response.data;
  },

  async updateEntry(data: UpdateEntryRequest) {
    const { id, ...updateData } = data;
    const response = await api.put<EntryTableRow>(`/api/v1/entries/${id}`, updateData);
    return response.data;
  },

  async deleteEntry(data: DeleteEntryRequest) {
    await api.delete(`/api/v1/entries/${data.id}`);
  },

  async bulkUpdateEntries(data: BulkUpdateRequest) {
    const response = await api.patch<EntryTableRow[]>('/api/v1/entries/bulk', data);
    return response.data;
  },

  async getEntryStats() {
    const response = await api.get('/api/v1/entries/stats');
    return response.data;
  },
};
