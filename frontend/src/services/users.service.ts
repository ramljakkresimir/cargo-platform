import api from './api';

export const usersService = {
  getMe: () => api.get('/users/me'),

  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }) => api.patch('/users/me', data),

  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }) => api.patch('/users/change-password', data),
};
