import { IsOptional, IsString, IsDateString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FilterCargoPostsDto extends PaginationDto {
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
