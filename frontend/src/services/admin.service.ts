import api from './api';

export const adminService = {
  getStats: () => api.get('/admin/stats'),

  // Users
  getUsers: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/admin/users', { params }),

  updateUserRole: (id: string, role: string) =>
    api.patch(`/admin/users/${id}/role`, { role }),

  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),

  getUserById: (id: string) => api.get(`/admin/users/${id}`),

  getUserCompany: (id: string) => api.get(`/admin/users/${id}/company`),

  updateUserCompany: (id: string, data: Record<string, unknown>) =>
    api.patch(`/admin/users/${id}/company`, data),

  // Bulk post actions
  getExpiredPostsCount: () => api.get('/admin/posts/expired-count'),

  closeExpiredPosts: () => api.post('/admin/posts/close-expired'),

  // Cargo Posts
  getCargoPosts: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    api.get('/admin/cargo-posts', { params }),

  updateCargoPostStatus: (id: string, status: string) =>
    api.patch(`/admin/cargo-posts/${id}/status`, { status }),

  deleteCargoPost: (id: string) => api.delete(`/admin/cargo-posts/${id}`),

  // Vehicle Posts
  getVehiclePosts: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    api.get('/admin/vehicle-posts', { params }),

  updateVehiclePostStatus: (id: string, status: string) =>
    api.patch(`/admin/vehicle-posts/${id}/status`, { status }),

  deleteVehiclePost: (id: string) => api.delete(`/admin/vehicle-posts/${id}`),
};
