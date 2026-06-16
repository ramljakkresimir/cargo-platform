import { IsEnum } from 'class-validator';
import { UserRole } from '../../users/user.entity';

export class UpdateUserRoleDto {
  @IsEnum(UserRole, { message: 'Role must be "user" or "admin"' })
  role: UserRole;
}
