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

  @IsOptional()
  @IsDateString()
  loadingDate?: string;

  @IsOptional()
  @IsString()
  cargoType?: string;

  @IsOptional()
  @IsString()
  requiredVehicleType?: string;
}
