import { IsString, MinLength, MaxLength } from 'class-validator';
import { IsNotCommonPassword } from '../../common/validators/not-common-password.validator';

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(128, { message: 'Password must be at most 128 characters long' })
  @IsNotCommonPassword()
  newPassword: string;
}
