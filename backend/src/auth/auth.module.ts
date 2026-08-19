import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { CaptchaModule } from '../common/captcha/captcha.module';
import { MailModule } from '../common/mail/mail.module';

@Module({
  imports: [
    UsersModule, // Needed to look up users during register/login/token validation
    PassportModule, // Required by @nestjs/passport to set up the 'jwt' strategy
    CaptchaModule, // Server-side Turnstile verification for register/login/reset flows
    MailModule, // Verification / password-reset / duplicate-registration-notice emails

    // Configure JWT signing with values from .env
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          // Cast needed: @nestjs/jwt types expiresIn as StringValue (ms package), not plain string
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') ||
            '7d') as StringValue,
        },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
