// Single source of truth for the TypeORM entity list — shared by AppModule
// (runtime connection) and data-source.ts (CLI connection used by migrations),
// so the two can never drift out of sync.
import { User } from './users/user.entity';
import { Company } from './companies/company.entity';
import { CargoPost } from './cargo-posts/cargo-post.entity';
import { VehiclePost } from './vehicle-posts/vehicle-post.entity';
import { City } from './cities/city.entity';
import { VehiclePostRouteCity } from './routing/vehicle-post-route-city.entity';

export const entities = [
  User,
  Company,
  CargoPost,
  VehiclePost,
  City,
  VehiclePostRouteCity,
];
