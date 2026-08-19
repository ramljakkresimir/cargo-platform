import api from './api';

export const authService = {
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    captchaToken: string;
  }) => api.post('/auth/register', data),

  login: (data: { email: string; password: string; captchaToken?: string }) =>
    api.post('/auth/login', data),

  verifyEmail: (token: string) => api.post('/auth/verify-email', { token }),

  resendVerification: (data: { email: string; captchaToken: string }) =>
    api.post('/auth/resend-verification', data),

  forgotPassword: (data: { email: string; captchaToken: string }) =>
    api.post('/auth/forgot-password', data),

  resetPassword: (data: { token: string; newPassword: string }) =>
    api.post('/auth/reset-password', data),
};
