import api from './api';

export const companiesService = {
  getMyCompany: () => api.get('/companies/me'),

  createCompany: (data: {
    companyName: string;
    companyType: string;
    country: string;
    city: string;
    address?: string;
    taxNumber?: string;
    phone?: string;
    email?: string;
    description?: string;
  }) => api.post('/companies', data),

  updateMyCompany: (data: Partial<{
    companyName: string;
    companyType: string;
    country: string;
    city: string;
    address: string;
    taxNumber: string;
    phone: string;
    email: string;
    description: string;
  }>) => api.patch('/companies/me', data),
};
