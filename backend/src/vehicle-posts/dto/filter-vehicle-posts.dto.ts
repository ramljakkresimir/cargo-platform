import { IsOptional, IsString, IsDateString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FilterVehiclePostsDto extends PaginationDto {
  @IsOptional() @IsString()
  availableLocation?: string;

  @IsOptional() @IsDateString()
  availableFromDate?: string;

  @IsOptional() @IsString()
  vehicleType?: string;

  @IsOptional() @IsString()
  destinationPreference?: string;
}
