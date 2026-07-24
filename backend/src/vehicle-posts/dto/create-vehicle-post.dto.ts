import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVehiclePostDto {
  @IsUUID()
  originCityId: string;

  @IsOptional()
  @IsUUID()
  destinationCityId?: string;

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
  note?: string;
}
