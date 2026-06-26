import api from './api';
import { City } from '../types';

export const citiesService = {
  search: (params: { search?: string; country?: string; limit?: number }) =>
    api.get<City[]>('/cities', { params }),
};
