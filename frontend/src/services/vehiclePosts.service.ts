import api from './api';

export const vehiclePostsService = {
  getAll: (filters?: {
    availableLocation?: string;
    availableFromDate?: string;
    vehicleType?: string;
    destinationPreference?: string;
  }) => api.get('/vehicle-posts', { params: filters }),

  getOne: (id: string) => api.get(`/vehicle-posts/${id}`),

  create: (data: {
    availableLocation: string;
    availableFromDate: string;
    vehicleType: string;
    capacity?: number;
    destinationPreference?: string;
    note?: string;
  }) => api.post('/vehicle-posts', data),

  update: (id: string, data: Record<string, any>) =>
    api.patch(`/vehicle-posts/${id}`, data),

  remove: (id: string) => api.delete(`/vehicle-posts/${id}`),

  getMine: () => api.get('/vehicle-posts/my'),
};
