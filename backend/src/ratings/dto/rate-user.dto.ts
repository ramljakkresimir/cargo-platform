import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class RateUserDto {
  @IsUUID()
  ratedUserId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  score: number;

  @IsOptional()
  @IsUUID()
  cargoPostId?: string;

  @IsOptional()
  @IsUUID()
  vehiclePostId?: string;
}
