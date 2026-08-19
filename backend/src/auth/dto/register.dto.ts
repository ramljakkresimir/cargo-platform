import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { IsNotCommonPassword } from '../../common/validators/not-common-password.validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(128, { message: 'Password must be at most 128 characters long' })
  @IsNotCommonPassword()
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  // Cloudflare Turnstile token from the frontend widget — verified server-side in
  // AuthService.register(); never trust the frontend's own pass/fail state.
  @IsString({ message: 'CAPTCHA verification is required' })
  captchaToken: string;
}
