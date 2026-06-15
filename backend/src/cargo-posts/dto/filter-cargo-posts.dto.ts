import { IsOptional, IsString, IsDateString } from 'class-validator';

// All fields are optional — the frontend can send any combination of filters
export class FilterCargoPostsDto {
  @IsOptional() @IsString()
  loadingLocation?: string;

  @IsOptional() @IsString()
  unloadingLocation?: string;

  @IsOptional() @IsDateString()
  loadingDate?: string;

  @IsOptional() @IsString()
  cargoType?: string;

  @IsOptional() @IsString()
  requiredVehicleType?: string;
}
