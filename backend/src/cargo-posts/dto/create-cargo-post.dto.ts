import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCargoPostDto {
  @IsString()
  loadingLocation: string;

  @IsString()
  unloadingLocation: string;

  // Accepts ISO date strings like "2026-07-15"
  @IsDateString()
  loadingDate: string;

  @IsOptional()
  @IsString()
  cargoType?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  weight?: number;

  @IsOptional()
  @IsString()
  dimensions?: string;

  @IsOptional()
  @IsString()
  requiredVehicleType?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
