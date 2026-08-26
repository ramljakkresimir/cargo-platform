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

  // Lower bound — "available on or after this date" (kept as the exact query param
  // name for backward compatibility, but now inclusive-range rather than exact-match
  // so the "Danas" / "Ovaj tjedan" quick filters can express a range through the same
  // field).
  @IsOptional()
  @IsDateString()
  availableFromDate?: string;

  // Optional upper bound, paired with availableFromDate to express a range.
  @IsOptional()
  @IsDateString()
  availableFromDateTo?: string;

  @IsOptional()
  @IsString()
  vehicleType?: string;

  @IsOptional()
  @IsString()
  destinationPreference?: string;
}
