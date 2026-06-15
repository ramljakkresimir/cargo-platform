import { IsString, IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PostStatus } from '../../common/enums/post-status.enum';

export class UpdateCargoPostDto {
  @IsOptional() @IsString()
  loadingLocation?: string;

  @IsOptional() @IsString()
  unloadingLocation?: string;

  @IsOptional() @IsDateString()
  loadingDate?: string;

  @IsOptional() @IsString()
  cargoType?: string;

  @IsOptional() @IsNumber() @Type(() => Number)
  weight?: number;

  @IsOptional() @IsString()
  dimensions?: string;

  @IsOptional() @IsString()
  requiredVehicleType?: string;

  @IsOptional() @IsNumber() @Type(() => Number)
  price?: number;

  @IsOptional() @IsString()
  note?: string;

  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;
}
