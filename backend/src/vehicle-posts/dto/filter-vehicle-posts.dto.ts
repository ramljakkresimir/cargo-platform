import { IsOptional, IsString, IsDateString } from 'class-validator';

export class FilterVehiclePostsDto {
  @IsOptional() @IsString()
  availableLocation?: string;

  @IsOptional() @IsDateString()
  availableFromDate?: string;

  @IsOptional() @IsString()
  vehicleType?: string;

  @IsOptional() @IsString()
  destinationPreference?: string;
}
