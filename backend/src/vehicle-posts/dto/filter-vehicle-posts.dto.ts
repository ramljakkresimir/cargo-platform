import { IsOptional, IsString, IsDateString, IsUUID } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FilterVehiclePostsDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  originCityId?: string;

  @IsOptional()
  @IsUUID()
  destinationCityId?: string;

  // Legacy text filters kept for backward compatibility
  @IsOptional()
  @IsString()
  availableLocation?: string;

  @IsOptional()
  @IsDateString()
  availableFromDate?: string;

  @IsOptional()
  @IsString()
  vehicleType?: string;

  @IsOptional()
  @IsString()
  destinationPreference?: string;
}
