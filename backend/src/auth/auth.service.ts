import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { CaptchaService } from '../common/captcha/captcha.service';
import { MailService } from '../common/mail/mail.service';
import { generateSecureToken, hashToken } from '../common/utils/token.util';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const GENERIC_INVALID_LOGIN = 'Invalid email or password';
const GENERIC_INVALID_TOKEN =
  'This link is invalid or has expired. Please request a new one.';
const CAPTCHA_REQUIRED_MESSAGE =
  'CAPTCHA verification required — please complete the challenge and try again.';
const CAPTCHA_FAILED_MESSAGE = 'CAPTCHA verification failed. Please try again.';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly captchaService: CaptchaService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  // ── Config helpers ────────────────────────────────────────────────

  private getFrontendUrl(): string {
    return (
      this.configService.get<string>('CORS_ORIGIN') || 'http://localhost:5173'
    );
  }

  private getNumberEnv(key: string, fallback: number): number {
    const raw = this.configService.get<string>(key);
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  private get verificationTtlMinutes(): number {
    return this.getNumberEnv('EMAIL_VERIFICATION_TOKEN_TTL_MINUTES', 1440); // 24h
  }

  private get passwordResetTtlMinutes(): number {
    return this.getNumberEnv('PASSWORD_RESET_TOKEN_TTL_MINUTES', 60); // 1h
  }

  private get resendCooldownSeconds(): number {
    return this.getNumberEnv('EMAIL_RESEND_COOLDOWN_SECONDS', 60);
  }

  private get loginCaptchaThreshold(): number {
    return this.getNumberEnv('LOGIN_CAPTCHA_FAILED_ATTEMPTS_THRESHOLD', 3);
  }

  private get loginCaptchaWindowMinutes(): number {
    return this.getNumberEnv('LOGIN_CAPTCHA_WINDOW_MINUTES', 15);
  }

  // ── Registration ───────────────────────────────────────────────────

  async register(dto: RegisterDto, ip: string) {
    const captchaOk = await this.captchaService.verify(dto.captchaToken, ip);
    if (!captchaOk) {
      this.logger.warn(`Registration blocked — captcha verification failed`);
      throw new BadRequestException(CAPTCHA_FAILED_MESSAGE);
    }

    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      // Don't create a second account and don't reveal via the response that this
      // email is taken — instead notify the existing owner, best-effort, so a
      // legitimate user who forgot they already registered has a path forward
      // (forgot password) without an attacker learning anything from the response.
      this.logger.warn(
        `Registration attempted for an email that already has an account`,
      );
      try {
        await this.mailService.sendDuplicateRegistrationNotice(
          existing.email,
          existing.firstName,
          `${this.getFrontendUrl()}/forgot-password`,
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Failed to send duplicate-registration notice: ${message}`,
        );
      }
      return this.genericRegisterResponse();
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const { raw, hash } = generateSecureToken();

    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      emailVerified: false,
      emailVerificationTokenHash: hash,
      emailVerificationExpiresAt: new Date(
        Date.now() + this.verificationTtlMinutes * 60_000,
      ),
      emailVerificationLastSentAt: new Date(),
    });

    // Unlike the duplicate-account notice above, a real new registration's verification
    // email is load-bearing — if it can't be sent (e.g. SMTP misconfigured in production),
    // MailService throws and that failure should surface to the caller as a real error.
    await this.mailService.sendVerificationEmail(
      user.email,
      user.firstName,
      `${this.getFrontendUrl()}/verify-email?token=${raw}`,
    );
    this.logger.log(`Registered new account and sent verification email`);

    return this.genericRegisterResponse();
  }

  private genericRegisterResponse() {
    return {
      message:
        'If this email address is not already registered, a verification email has been sent to it. ' +
        'If it already has an account, we sent that account a notice instead.',
    };
  }

  // ── Login ──────────────────────────────────────────────────────────

  async login(dto: LoginDto, ip: string) {
    const user = await this.usersService.findByEmail(dto.email);

    // Account-based captcha escalation: only kicks in after repeated failures on THIS
    // account, so legitimate users logging in normally never see a challenge. Checked
    // before the password compare so a client that skips it can't keep burning guesses.
    if (user && this.isLoginCaptchaRequired(user)) {
      const captchaOk = await this.captchaService.verify(dto.captchaToken, ip);
      if (!captchaOk) {
        this.logger.warn(
          `Login blocked pending CAPTCHA — account has ${user.failedLoginAttempts} recent failed attempts`,
        );
        throw new BadRequestException(CAPTCHA_REQUIRED_MESSAGE);
      }
    }

    if (!user) {
      throw new UnauthorizedException(GENERIC_INVALID_LOGIN);
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      user.lastFailedLoginAt = new Date();
      await this.usersService.save(user);
      this.logger.warn(
        `Failed login attempt (${user.failedLoginAttempts} recent) for an existing account`,
      );
      throw new UnauthorizedException(GENERIC_INVALID_LOGIN);
    }

    if (!user.emailVerified) {
      this.logger.warn(`Login blocked — email not verified`);
      throw new ForbiddenException(
        'Please verify your email address before signing in.',
      );
    }

    if (user.failedLoginAttempts > 0) {
      user.failedLoginAttempts = 0;
      user.lastFailedLoginAt = null;
      await this.usersService.save(user);
    }

    this.logger.log(`User logged in successfully`);

    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  private isLoginCaptchaRequired(user: {
    failedLoginAttempts: number;
    lastFailedLoginAt: Date | null;
  }): boolean {
    if (user.failedLoginAttempts < this.loginCaptchaThreshold) return false;
    if (!user.lastFailedLoginAt) return false;
    const windowMs = this.loginCaptchaWindowMinutes * 60_000;
    return Date.now() - user.lastFailedLoginAt.getTime() < windowMs;
  }

  // ── Email verification ────────────────────────────────────────────

  async verifyEmail(dto: VerifyEmailDto) {
    const hash = hashToken(dto.token);
    const user = await this.usersService.findByEmailVerificationTokenHash(hash);

    // A missing user here covers three cases uniformly: unknown token, expired-and-since-
    // regenerated token, and an already-consumed (single-use) token — the hash is cleared
    // on successful verification, so a reused token simply won't match anyone. Not
    // distinguishing these cases in the response avoids leaking which one occurred.
    if (
      !user ||
      !user.emailVerificationExpiresAt ||
      user.emailVerificationExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException(GENERIC_INVALID_TOKEN);
    }

    user.emailVerified = true;
    user.emailVerificationTokenHash = null;
    user.emailVerificationExpiresAt = null;
    await this.usersService.save(user);
    this.logger.log(`Email verified successfully`);

    return {
      message: 'Your email address has been verified. You can now sign in.',
    };
  }

  async resendVerification(dto: ResendVerificationDto, ip: string) {
    const captchaOk = await this.captchaService.verify(dto.captchaToken, ip);
    if (!captchaOk) {
      throw new BadRequestException(CAPTCHA_FAILED_MESSAGE);
    }

    const user = await this.usersService.findByEmail(dto.email);

    if (user && !user.emailVerified) {
      const withinCooldown =
        user.emailVerificationLastSentAt &&
        Date.now() - user.emailVerificationLastSentAt.getTime() <
          this.resendCooldownSeconds * 1000;

      if (!withinCooldown) {
        const { raw, hash } = generateSecureToken();
        user.emailVerificationTokenHash = hash;
        user.emailVerificationExpiresAt = new Date(
          Date.now() + this.verificationTtlMinutes * 60_000,
        );
        user.emailVerificationLastSentAt = new Date();
        await this.usersService.save(user);

        try {
          await this.mailService.sendVerificationEmail(
            user.email,
            user.firstName,
            `${this.getFrontendUrl()}/verify-email?token=${raw}`,
          );
          this.logger.log(`Resent verification email`);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          this.logger.warn(`Failed to resend verification email: ${message}`);
        }
      } else {
        this.logger.log(
          `Resend-verification request skipped — within cooldown`,
        );
      }
    }

    return {
      message:
        'If an account with this email exists and is not yet verified, a new verification email has been sent.',
    };
  }

  // ── Password reset ────────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto, ip: string) {
    const captchaOk = await this.captchaService.verify(dto.captchaToken, ip);
    if (!captchaOk) {
      throw new BadRequestException(CAPTCHA_FAILED_MESSAGE);
    }

    const user = await this.usersService.findByEmail(dto.email);

    if (user) {
      const withinCooldown =
        user.passwordResetLastSentAt &&
        Date.now() - user.passwordResetLastSentAt.getTime() <
          this.resendCooldownSeconds * 1000;

      if (!withinCooldown) {
        const { raw, hash } = generateSecureToken();
        user.passwordResetTokenHash = hash;
        user.passwordResetExpiresAt = new Date(
          Date.now() + this.passwordResetTtlMinutes * 60_000,
        );
        user.passwordResetLastSentAt = new Date();
        await this.usersService.save(user);

        try {
          await this.mailService.sendPasswordResetEmail(
            user.email,
            user.firstName,
            `${this.getFrontendUrl()}/reset-password?token=${raw}`,
          );
          this.logger.log(`Password reset email sent`);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          this.logger.warn(`Failed to send password reset email: ${message}`);
        }
      } else {
        this.logger.log(`Forgot-password request skipped — within cooldown`);
      }
    }

    this.logger.log(`Password reset requested`);
    return {
      message:
        'If an account with this email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const hash = hashToken(dto.token);
    const user = await this.usersService.findByPasswordResetTokenHash(hash);

    // Same unified-response reasoning as verifyEmail(): missing user covers unknown,
    // expired, and already-used tokens without distinguishing which.
    if (
      !user ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException(GENERIC_INVALID_TOKEN);
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    // Reusing the Session-18 mechanism: any JWT issued before this timestamp is rejected
    // by JwtStrategy, so a password reset invalidates every existing session immediately.
    user.passwordChangedAt = new Date();
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    user.failedLoginAttempts = 0;
    user.lastFailedLoginAt = null;
    await this.usersService.save(user);
    this.logger.log(`Password reset completed`);

    return {
      message:
        'Your password has been reset. You can now sign in with your new password.',
    };
  }
}
