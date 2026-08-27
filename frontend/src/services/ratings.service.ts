import api from './api';
import { Rating, RatingSummary } from '../types';

export const ratingsService = {
  submit: (payload: { ratedUserId: string; score: number; cargoPostId?: string; vehiclePostId?: string }) =>
    api.post<Rating>('/ratings', payload),

  getSummary: (userId: string) => api.get<RatingSummary>(`/ratings/user/${userId}/summary`),

  getSummaries: (userIds: string[]) =>
    api.post<{ results: RatingSummary[] }>('/ratings/summaries', { userIds }),

  getMine: (userId: string) => api.get<Rating | null>(`/ratings/user/${userId}/mine`),
};
