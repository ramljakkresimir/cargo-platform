import api from './api';
import { City } from '../types';

export interface CityDistancePair {
  fromCityId: string;
  toCityId: string;
}

export interface CityDistanceResult extends CityDistancePair {
  distanceKm: number | null;
}

export const citiesService = {
  search: (params: { search?: string; country?: string; limit?: number }) =>
    api.get<City[]>('/cities', { params }),

  getDistances: (pairs: CityDistancePair[]) =>
    api.post<{ results: CityDistanceResult[] }>('/cities/distances', { pairs }),
};
