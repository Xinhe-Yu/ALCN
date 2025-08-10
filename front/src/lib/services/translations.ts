import { api } from '../interceptors';
import type {
  Translation,
  UpdateTranslationRequest,
} from '@/app/types';

export const translationsService = {
  async getTranslation(id: string) {
    const response = await api.get<Translation>(`/api/v1/translations/${id}`);
    return response.data;
  },

  async updateTranslation(data: UpdateTranslationRequest) {
    const { id, ...updateData } = data;
    const response = await api.put<Translation>(`/api/v1/translations/${id}`, updateData);
    return response.data;
  },

  async deleteTranslation(id: string) {
    await api.delete(`/api/v1/translations/${id}`);
  },
};