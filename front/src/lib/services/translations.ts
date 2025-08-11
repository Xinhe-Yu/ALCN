import { api } from '../interceptors';
import type {
  Translation,
  UpdateTranslationRequest,
  CreateTranslationRequest,
} from '@/app/types';

export type VoteType = 'up' | 'down';

export interface VoteRequest {
  vote_type: VoteType;
}

export interface VoteResponse {
  id: string;
  translation_id: string;
  user_id: string;
  vote_type: VoteType;
  created_at: string;
  updated_at: string;
}

export const translationsService = {
  async getTranslation(id: string) {
    const response = await api.get<Translation>(`/api/v1/translations/${id}`);
    return response.data;
  },

  async createTranslation(data: CreateTranslationRequest) {
    const response = await api.post<Translation>('/api/v1/translations/', data);
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

  // Voting methods
  async voteOnTranslation(translationId: string, voteType: VoteType) {
    const response = await api.post<VoteResponse>(`/api/v1/translations/${translationId}/vote`, {
      vote_type: voteType
    });
    return response.data;
  },

  async removeVote(translationId: string) {
    const response = await api.delete(`/api/v1/translations/${translationId}/vote`);
    return response.data;
  },

  async getUserVote(translationId: string) {
    try {
      const response = await api.get<VoteResponse>(`/api/v1/translations/${translationId}/vote`);
      return response.data;
    } catch (error) {
      // Return null if no vote found (404)
      return null;
    }
  },
};
