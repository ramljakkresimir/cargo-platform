export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
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

export interface CargoPost {
  id: string;
  companyId: string;
  company?: Company;
  loadingLocation: string;
  unloadingLocation: string;
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

export interface VehiclePost {
  id: string;
  companyId: string;
  company?: Company;
  availableLocation: string;
  availableFromDate: string;
  vehicleType: string;
  capacity?: number;
  destinationPreference?: string;
  note?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
