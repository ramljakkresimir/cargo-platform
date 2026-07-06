export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Company {
  id: string;
  userId: string;
  companyName: string;
  companyType: string;
  country: string;
  city: string;
  address?: string;
  taxNumber?: string;
  phone?: string;
  email?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface City {
  id: string;
  name: string;
  country: string;
  region?: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
}

export interface CargoPost {
  id: string;
  companyId: string;
  company?: Company;
  loadingCityId?: string | null;
  loadingCity?: City | null;
  unloadingCityId?: string | null;
  unloadingCity?: City | null;
  // Legacy fields — may be null for new posts
  loadingLocation?: string | null;
  unloadingLocation?: string | null;
  loadingDate: string;
  cargoType?: string;
  weight?: number;
  dimensions?: string;
  requiredVehicleType?: string;
  price?: number;
  note?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehiclePostRouteCity {
  id: string;
  vehiclePostId: string;
  cityId: string;
  city: City;
  orderIndex: number;
  distanceFromStartKm: number;
  distanceFromRouteKm: number;
  createdAt: string;
  updatedAt: string;
}

export interface RouteCoordinate {
  lat: number;
  lng: number;
}

export interface VehiclePost {
  id: string;
  companyId: string;
  company?: Company;
  originCityId?: string | null;
  originCity?: City | null;
  destinationCityId?: string | null;
  destinationCity?: City | null;
  // Legacy fields — may be null for new posts
  availableLocation?: string | null;
  destinationPreference?: string | null;
  availableFromDate: string;
  vehicleType: string;
  capacity?: number;
  note?: string;
  status: string;
  routeCities?: VehiclePostRouteCity[];
  routeGeoJson?: RouteCoordinate[] | null;
  createdAt: string;
  updatedAt: string;
}
