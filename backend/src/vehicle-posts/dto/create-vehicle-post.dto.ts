import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVehiclePostDto {
  @IsString()
  availableLocation: string;

  @IsDateString()
  availableFromDate: string;

  @IsString()
  vehicleType: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  capacity?: number;

  @IsOptional()
  @IsString()
  destinationPreference?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
