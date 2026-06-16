import { IsEnum } from 'class-validator';
import { PostStatus } from '../../common/enums/post-status.enum';

export class UpdatePostStatusDto {
  @IsEnum(PostStatus, { message: 'Status must be "active", "closed", or "expired"' })
  status: PostStatus;
}
