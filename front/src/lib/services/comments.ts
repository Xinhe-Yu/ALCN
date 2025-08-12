import { api } from '../interceptors';
import type { Comment } from '@/app/types/comments';

export interface CreateCommentRequest {
  entry_id: string;
  content: string;
  parent_comment_id?: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export const commentsService = {
  async getEntryComments(entryId: string) {
    const response = await api.get<Comment[]>(`/api/v1/comments/entry/${entryId}`);
    return response.data;
  },

  async createComment(data: CreateCommentRequest) {
    const response = await api.post<Comment>('/api/v1/comments/', data);
    return response.data;
  },

  async updateComment(commentId: string, data: UpdateCommentRequest) {
    const response = await api.put<Comment>(`/api/v1/comments/${commentId}`, data);
    return response.data;
  },

  async deleteComment(commentId: string) {
    const response = await api.delete(`/api/v1/comments/${commentId}`);
    return response.data;
  },
};