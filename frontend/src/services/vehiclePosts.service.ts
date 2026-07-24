import api from './api';

export const vehiclePostsService = {
  getAll: (params?: {
    originCityId?: string;
    destinationCityId?: string;
    availableFromDate?: string;
    vehicleType?: string;
    page?: number;
    limit?: number;
  }) => api.get('/vehicle-posts', { params }),

  getOne: (id: string) => api.get(`/vehicle-posts/${id}`),

  create: (data: {
    originCityId: string;
    destinationCityId?: string;
    availableFromDate: string;
    vehicleType: string;
    capacity?: number;
    note?: string;
  }) => api.post('/vehicle-posts', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/vehicle-posts/${id}`, data),

  remove: (id: string) => api.delete(`/vehicle-posts/${id}`),

  getMine: () => api.get('/vehicle-posts/my'),
};
