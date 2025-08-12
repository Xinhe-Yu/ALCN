import { api } from '../interceptors';
import type { Token, User } from '@/app/types';

export const authService = {
  async login(email: string) {
    const response = await api.post<{message: string; dev_code?: string}>('/api/v1/auth/login', { email });
    return response.data;
  },

  async verify(email: string, code: string) {
    const response = await api.post<Token>('/api/v1/auth/verify', { email, code });
    return response.data;
  },

  async getMe() {
    const response = await api.get<User>('/api/v1/auth/me');
    return response.data;
  },
};