import api from './api';

export const cargoPostsService = {
  getAll: (filters?: {
    loadingLocation?: string;
    unloadingLocation?: string;
    loadingDate?: string;
    cargoType?: string;
    requiredVehicleType?: string;
  }) => api.get('/cargo-posts', { params: filters }),

  getOne: (id: string) => api.get(`/cargo-posts/${id}`),

  create: (data: {
    loadingLocation: string;
    unloadingLocation: string;
    loadingDate: string;
    cargoType?: string;
    weight?: number;
    dimensions?: string;
    requiredVehicleType?: string;
    price?: number;
    note?: string;
  }) => api.post('/cargo-posts', data),

  update: (id: string, data: Record<string, any>) =>
    api.patch(`/cargo-posts/${id}`, data),

  remove: (id: string) => api.delete(`/cargo-posts/${id}`),

  getMine: () => api.get('/cargo-posts/my'),
};
