import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

// Per-route rate limits, overriding the app-wide default (60/min). Values are read from
// env at module-load time so they're configurable per deployment without a code change —
// same pattern this file already used for AUTH_THROTTLE before this feature.
const numEnv = (key: string, fallback: number): number => {
  const raw = process.env[key];
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const REGISTER_THROTTLE = {
  default: { limit: numEnv('RATE_LIMIT_REGISTER_PER_MIN', 5), ttl: 60_000 },
};
const LOGIN_THROTTLE = {
  default: { limit: numEnv('RATE_LIMIT_LOGIN_PER_MIN', 5), ttl: 60_000 },
};
const VERIFY_EMAIL_THROTTLE = {
  default: {
    limit: numEnv('RATE_LIMIT_VERIFY_EMAIL_PER_MIN', 10),
    ttl: 60_000,
  },
};
const RESEND_VERIFICATION_THROTTLE = {
  default: {
    limit: numEnv('RATE_LIMIT_RESEND_VERIFICATION_PER_MIN', 3),
    ttl: 60_000,
  },
};
const FORGOT_PASSWORD_THROTTLE = {
  default: {
    limit: numEnv('RATE_LIMIT_FORGOT_PASSWORD_PER_MIN', 3),
    ttl: 60_000,
  },
};
const RESET_PASSWORD_THROTTLE = {
  default: {
    limit: numEnv('RATE_LIMIT_RESET_PASSWORD_PER_MIN', 5),
    ttl: 60_000,
  },
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/register
  @Throttle(REGISTER_THROTTLE)
  @Post('register')
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, req.ip || '');
  }

  // POST /auth/login
  // @HttpCode(200) overrides the default 201 Created — login should return 200 OK
  @Throttle(LOGIN_THROTTLE)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req.ip || '');
  }

  // POST /auth/verify-email
  @Throttle(VERIFY_EMAIL_THROTTLE)
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  // POST /auth/resend-verification
  @Throttle(RESEND_VERIFICATION_THROTTLE)
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  resendVerification(@Body() dto: ResendVerificationDto, @Req() req: Request) {
    return this.authService.resendVerification(dto, req.ip || '');
  }

  // POST /auth/forgot-password
  @Throttle(FORGOT_PASSWORD_THROTTLE)
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    return this.authService.forgotPassword(dto, req.ip || '');
  }

  // POST /auth/reset-password
  @Throttle(RESET_PASSWORD_THROTTLE)
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
