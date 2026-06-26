import { IsString, IsOptional, IsNumber, IsDateString, IsEnum, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { PostStatus } from '../../common/enums/post-status.enum';

export class UpdateVehiclePostDto {
  @IsOptional()
  @IsUUID()
  originCityId?: string;

  @IsOptional()
  @IsUUID()
  destinationCityId?: string;

  @IsOptional()
  @IsDateString()
  availableFromDate?: string;

  @IsOptional()
  @IsString()
  vehicleType?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  capacity?: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;
}
