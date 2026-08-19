import { IsEmail, IsString } from 'class-validator';

export class ResendVerificationDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString({ message: 'CAPTCHA verification is required' })
  captchaToken: string;
}
