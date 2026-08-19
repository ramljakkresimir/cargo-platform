import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { CaptchaService } from '../common/captcha/captcha.service';
import { MailService } from '../common/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hashToken } from '../common/utils/token.util';
import { User, UserRole } from '../users/user.entity';

type MockUsersService = {
  findByEmail: jest.Mock;
  create: jest.Mock<Promise<User>, [Partial<User>]>;
  save: jest.Mock;
  findByEmailVerificationTokenHash: jest.Mock;
  findByPasswordResetTokenHash: jest.Mock;
};

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'user@example.com',
    passwordHash: '',
    firstName: 'Ana',
    lastName: 'Anić',
    phone: undefined,
    role: UserRole.USER,
    passwordChangedAt: null,
    emailVerified: true,
    emailVerificationTokenHash: null,
    emailVerificationExpiresAt: null,
    emailVerificationLastSentAt: null,
    passwordResetTokenHash: null,
    passwordResetExpiresAt: null,
    passwordResetLastSentAt: null,
    failedLoginAttempts: 0,
    lastFailedLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    company: undefined,
    ...overrides,
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let usersService: MockUsersService;
  let captchaService: { verify: jest.Mock };
  let mailService: {
    sendVerificationEmail: jest.Mock;
    sendPasswordResetEmail: jest.Mock;
    sendDuplicateRegistrationNotice: jest.Mock;
  };
  let jwtService: { sign: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn((data: Partial<User>) => Promise.resolve(makeUser(data))),
      save: jest.fn((u: User) => Promise.resolve(u)),
      findByEmailVerificationTokenHash: jest.fn(),
      findByPasswordResetTokenHash: jest.fn(),
    };
    captchaService = { verify: jest.fn().mockResolvedValue(true) };
    mailService = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
      sendDuplicateRegistrationNotice: jest.fn().mockResolvedValue(undefined),
    };
    jwtService = { sign: jest.fn().mockReturnValue('signed-jwt') };
    configService = { get: jest.fn().mockReturnValue(undefined) };

    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
      captchaService as unknown as CaptchaService,
      mailService as unknown as MailService,
      configService as unknown as ConfigService,
    );
  });

  describe('register', () => {
    const dto = {
      email: 'new@example.com',
      password: 'a-decent-passphrase',
      firstName: 'Ana',
      lastName: 'Anić',
      captchaToken: 'token',
    };

    it('rejects when captcha verification fails', async () => {
      captchaService.verify.mockResolvedValue(false);
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.register(dto, '1.2.3.4')).rejects.toThrow(
        BadRequestException,
      );
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('creates an unverified account and sends a verification email', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await service.register(dto, '1.2.3.4');

      expect(usersService.create).toHaveBeenCalledTimes(1);
      const created = usersService.create.mock.calls[0][0];
      expect(created.emailVerified).toBe(false);
      expect(created.emailVerificationTokenHash).toEqual(expect.any(String));
      expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
    });

    it('does not create a second account for a duplicate email and notifies the existing owner instead', async () => {
      const existing = makeUser({ email: dto.email });
      usersService.findByEmail.mockResolvedValue(existing);

      const result = await service.register(dto, '1.2.3.4');

      expect(usersService.create).not.toHaveBeenCalled();
      expect(mailService.sendDuplicateRegistrationNotice).toHaveBeenCalledWith(
        existing.email,
        existing.firstName,
        expect.stringContaining('/forgot-password'),
      );
      // Response must be indistinguishable from the "new account" success response —
      // this is the anti-enumeration guarantee.
      expect(result.message).toEqual(expect.any(String));
    });

    it('still returns the generic response even if the duplicate-notice email fails to send', async () => {
      const existing = makeUser({ email: dto.email });
      usersService.findByEmail.mockResolvedValue(existing);
      mailService.sendDuplicateRegistrationNotice.mockRejectedValue(
        new Error('smtp down'),
      );

      const result = await service.register(dto, '1.2.3.4');
      expect(result.message).toEqual(expect.any(String));
    });
  });

  describe('login', () => {
    const dto = { email: 'user@example.com', password: 'correct-password' };

    it('rejects unknown email with a generic message', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(dto, '1.2.3.4')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects wrong password with a generic message and records the failed attempt', async () => {
      const hash = await bcrypt.hash('correct-password', 10);
      const user = makeUser({ passwordHash: hash });
      usersService.findByEmail.mockResolvedValue(user);

      await expect(
        service.login({ ...dto, password: 'wrong' }, '1.2.3.4'),
      ).rejects.toThrow(UnauthorizedException);

      expect(user.failedLoginAttempts).toBe(1);
      expect(usersService.save).toHaveBeenCalledWith(user);
    });

    it('blocks login for a verified-but-wrong flag reset, and lets a verified user in on success', async () => {
      const hash = await bcrypt.hash('correct-password', 10);
      const user = makeUser({ passwordHash: hash, emailVerified: true });
      usersService.findByEmail.mockResolvedValue(user);

      const result = await service.login(dto, '1.2.3.4');

      expect(result.access_token).toBe('signed-jwt');
      expect(result.user.email).toBe(user.email);
    });

    it('rejects an unverified account even with the correct password', async () => {
      const hash = await bcrypt.hash('correct-password', 10);
      const user = makeUser({ passwordHash: hash, emailVerified: false });
      usersService.findByEmail.mockResolvedValue(user);

      await expect(service.login(dto, '1.2.3.4')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('resets the failed-attempt counter on a successful login', async () => {
      const hash = await bcrypt.hash('correct-password', 10);
      const user = makeUser({
        passwordHash: hash,
        emailVerified: true,
        failedLoginAttempts: 2,
        lastFailedLoginAt: new Date(),
      });
      usersService.findByEmail.mockResolvedValue(user);

      await service.login(dto, '1.2.3.4');

      expect(user.failedLoginAttempts).toBe(0);
      expect(user.lastFailedLoginAt).toBeNull();
    });

    it('requires a valid captcha once the account has enough recent failed attempts', async () => {
      const hash = await bcrypt.hash('correct-password', 10);
      const user = makeUser({
        passwordHash: hash,
        emailVerified: true,
        failedLoginAttempts: 3,
        lastFailedLoginAt: new Date(),
      });
      usersService.findByEmail.mockResolvedValue(user);
      captchaService.verify.mockResolvedValue(false);

      await expect(service.login(dto, '1.2.3.4')).rejects.toThrow(
        BadRequestException,
      );
      // Password must never even be checked once captcha is required and missing/invalid.
      expect(user.failedLoginAttempts).toBe(3);
    });

    it('does not require captcha once the failed-attempt window has expired', async () => {
      const hash = await bcrypt.hash('correct-password', 10);
      const user = makeUser({
        passwordHash: hash,
        emailVerified: true,
        failedLoginAttempts: 5,
        lastFailedLoginAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24h ago
      });
      usersService.findByEmail.mockResolvedValue(user);
      captchaService.verify.mockResolvedValue(false);

      // Should succeed without ever calling captcha verification.
      const result = await service.login(dto, '1.2.3.4');
      expect(result.access_token).toBe('signed-jwt');
    });
  });

  describe('verifyEmail', () => {
    it('verifies a valid, unexpired token', async () => {
      const rawToken = 'raw-token-value';
      const user = makeUser({
        emailVerified: false,
        emailVerificationTokenHash: hashToken(rawToken),
        emailVerificationExpiresAt: new Date(Date.now() + 60_000),
      });
      usersService.findByEmailVerificationTokenHash.mockResolvedValue(user);

      const result = await service.verifyEmail({ token: rawToken });

      expect(user.emailVerified).toBe(true);
      expect(user.emailVerificationTokenHash).toBeNull();
      expect(result.message).toEqual(expect.any(String));
    });

    it('rejects an unknown token', async () => {
      usersService.findByEmailVerificationTokenHash.mockResolvedValue(null);

      await expect(service.verifyEmail({ token: 'bogus' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects an expired token', async () => {
      const rawToken = 'raw-token-value';
      const user = makeUser({
        emailVerified: false,
        emailVerificationTokenHash: hashToken(rawToken),
        emailVerificationExpiresAt: new Date(Date.now() - 60_000),
      });
      usersService.findByEmailVerificationTokenHash.mockResolvedValue(user);

      await expect(service.verifyEmail({ token: rawToken })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects a reused token (hash already cleared after first use)', async () => {
      // Simulates the second attempt: the lookup no longer finds anyone because the
      // hash was nulled out on the first successful verification.
      usersService.findByEmailVerificationTokenHash.mockResolvedValue(null);

      await expect(
        service.verifyEmail({ token: 'already-used-token' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('resendVerification', () => {
    const dto = { email: 'user@example.com', captchaToken: 'token' };

    it('rejects when captcha fails', async () => {
      captchaService.verify.mockResolvedValue(false);

      await expect(service.resendVerification(dto, '1.2.3.4')).rejects.toThrow(
        BadRequestException,
      );
      expect(usersService.findByEmail).not.toHaveBeenCalled();
    });

    it('sends a new verification email for an existing unverified account', async () => {
      const user = makeUser({
        emailVerified: false,
        emailVerificationLastSentAt: null,
      });
      usersService.findByEmail.mockResolvedValue(user);

      const result = await service.resendVerification(dto, '1.2.3.4');

      expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(result.message).toEqual(expect.any(String));
    });

    it('respects the resend cooldown and does not send a second email', async () => {
      const user = makeUser({
        emailVerified: false,
        emailVerificationLastSentAt: new Date(), // just sent
      });
      usersService.findByEmail.mockResolvedValue(user);

      const result = await service.resendVerification(dto, '1.2.3.4');

      expect(mailService.sendVerificationEmail).not.toHaveBeenCalled();
      // Response is identical whether or not the cooldown was hit — no signal leaked.
      expect(result.message).toEqual(expect.any(String));
    });

    it('returns the same generic response for an unknown email (no enumeration)', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.resendVerification(dto, '1.2.3.4');

      expect(mailService.sendVerificationEmail).not.toHaveBeenCalled();
      expect(result.message).toEqual(expect.any(String));
    });

    it('does not resend for an already-verified account', async () => {
      const user = makeUser({ emailVerified: true });
      usersService.findByEmail.mockResolvedValue(user);

      await service.resendVerification(dto, '1.2.3.4');

      expect(mailService.sendVerificationEmail).not.toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    const dto = { email: 'user@example.com', captchaToken: 'token' };

    it('rejects when captcha fails', async () => {
      captchaService.verify.mockResolvedValue(false);

      await expect(service.forgotPassword(dto, '1.2.3.4')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('sends a reset email for an existing account and returns the generic response', async () => {
      const user = makeUser();
      usersService.findByEmail.mockResolvedValue(user);

      const result = await service.forgotPassword(dto, '1.2.3.4');

      expect(mailService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
      expect(result.message).toEqual(expect.any(String));
    });

    it('returns the same generic response for an unknown account (no enumeration)', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword(dto, '1.2.3.4');

      expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
      expect(result.message).toEqual(expect.any(String));
    });

    it('respects the resend cooldown', async () => {
      const user = makeUser({ passwordResetLastSentAt: new Date() });
      usersService.findByEmail.mockResolvedValue(user);

      await service.forgotPassword(dto, '1.2.3.4');

      expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('resets the password for a valid token, invalidates existing sessions, and clears failed-attempt state', async () => {
      const rawToken = 'reset-token-value';
      const user = makeUser({
        passwordResetTokenHash: hashToken(rawToken),
        passwordResetExpiresAt: new Date(Date.now() + 60_000),
        failedLoginAttempts: 4,
        lastFailedLoginAt: new Date(),
        passwordChangedAt: null,
      });
      usersService.findByPasswordResetTokenHash.mockResolvedValue(user);

      const before = user.passwordHash;
      await service.resetPassword({
        token: rawToken,
        newPassword: 'brand-new-password',
      });

      expect(user.passwordHash).not.toBe(before);
      expect(user.passwordResetTokenHash).toBeNull();
      expect(user.passwordChangedAt).not.toBeNull();
      expect(user.failedLoginAttempts).toBe(0);
    });

    it('rejects an unknown token', async () => {
      usersService.findByPasswordResetTokenHash.mockResolvedValue(null);

      await expect(
        service.resetPassword({
          token: 'bogus',
          newPassword: 'brand-new-password',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an expired token', async () => {
      const rawToken = 'reset-token-value';
      const user = makeUser({
        passwordResetTokenHash: hashToken(rawToken),
        passwordResetExpiresAt: new Date(Date.now() - 60_000),
      });
      usersService.findByPasswordResetTokenHash.mockResolvedValue(user);

      await expect(
        service.resetPassword({
          token: rawToken,
          newPassword: 'brand-new-password',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a reused token (hash already cleared after first use)', async () => {
      usersService.findByPasswordResetTokenHash.mockResolvedValue(null);

      await expect(
        service.resetPassword({
          token: 'already-used',
          newPassword: 'brand-new-password',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
