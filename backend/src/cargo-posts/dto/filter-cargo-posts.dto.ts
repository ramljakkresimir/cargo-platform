import { IsOptional, IsString, IsDateString, IsUUID } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FilterCargoPostsDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  loadingCityId?: string;

  @IsOptional()
  @IsUUID()
  unloadingCityId?: string;

  // Legacy text filters kept for backward compatibility
  @IsOptional()
  @IsString()
  loadingLocation?: string;

  @IsOptional()
  @IsString()
  unloadingLocation?: string;

  // Lower bound — "loading on or after this date" (kept as the exact query param name
  // for backward compatibility, but now inclusive-range rather than exact-match so the
  // "Danas" / "Ovaj tjedan" quick filters can express a range through the same field).
  @IsOptional()
  @IsDateString()
  loadingDate?: string;

  // Optional upper bound, paired with loadingDate to express a range.
  @IsOptional()
  @IsDateString()
  loadingDateTo?: string;

  @IsOptional()
  @IsString()
  cargoType?: string;

  @IsOptional()
  @IsString()
  requiredVehicleType?: string;
}
