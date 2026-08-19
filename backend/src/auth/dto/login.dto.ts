import { IsEmail, IsString, IsOptional } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  password: string;

  // Only required once AuthService.login() decides this account needs it (after
  // repeated failed attempts) — see the captcha-escalation logic there.
  @IsOptional()
  @IsString()
  captchaToken?: string;
}
