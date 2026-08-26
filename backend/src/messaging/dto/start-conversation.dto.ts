import { IsOptional, IsUUID } from 'class-validator';

export class StartConversationDto {
  @IsUUID()
  recipientUserId: string;

  @IsOptional()
  @IsUUID()
  cargoPostId?: string;

  @IsOptional()
  @IsUUID()
  vehiclePostId?: string;
}
