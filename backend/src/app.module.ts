import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggingThrottlerGuard } from './common/guards/logging-throttler.guard';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { CargoPostsModule } from './cargo-posts/cargo-posts.module';
import { VehiclePostsModule } from './vehicle-posts/vehicle-posts.module';
import { AdminModule } from './admin/admin.module';
import { PostsExpirationModule } from './posts-expiration/posts-expiration.module';
import { CitiesModule } from './cities/cities.module';
import { MessagingModule } from './messaging/messaging.module';
import { RatingsModule } from './ratings/ratings.module';
import { entities } from './entities';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_HOST: Joi.string().required(),
        DATABASE_PORT: Joi.number().default(5432),
        DATABASE_USER: Joi.string().required(),
        DATABASE_PASSWORD: Joi.string().required(),
        DATABASE_NAME: Joi.string().required(),
        JWT_SECRET: Joi.string().min(16).required(),
        JWT_EXPIRES_IN: Joi.string().default('7d'),
        PORT: Joi.number().default(3000),

        // Bot protection and outbound email are optional in development (both degrade
        // gracefully — see CaptchaService/MailService) but must be explicitly configured
        // before a production deploy, so we fail fast at boot rather than silently
        // shipping with captcha bypassed or verification/reset emails unsendable.
        TURNSTILE_SECRET_KEY: Joi.string().when('NODE_ENV', {
          is: 'production',
          then: Joi.required(),
          otherwise: Joi.string().allow('').optional(),
        }),
        SMTP_HOST: Joi.string().when('NODE_ENV', {
          is: 'production',
          then: Joi.required(),
          otherwise: Joi.string().allow('').optional(),
        }),
        SMTP_PORT: Joi.number().default(587),
        SMTP_USER: Joi.string().allow('').optional(),
        SMTP_PASSWORD: Joi.string().allow('').optional(),
        SMTP_FROM: Joi.string().when('NODE_ENV', {
          is: 'production',
          then: Joi.required(),
          otherwise: Joi.string().allow('').optional(),
        }),

        EMAIL_VERIFICATION_TOKEN_TTL_MINUTES: Joi.number().default(1440),
        PASSWORD_RESET_TOKEN_TTL_MINUTES: Joi.number().default(60),
        EMAIL_RESEND_COOLDOWN_SECONDS: Joi.number().default(60),
        LOGIN_CAPTCHA_FAILED_ATTEMPTS_THRESHOLD: Joi.number().default(3),
        LOGIN_CAPTCHA_WINDOW_MINUTES: Joi.number().default(15),

        RATE_LIMIT_DEFAULT_PER_MIN: Joi.number().default(60),
        RATE_LIMIT_REGISTER_PER_MIN: Joi.number().default(5),
        RATE_LIMIT_LOGIN_PER_MIN: Joi.number().default(5),
        RATE_LIMIT_VERIFY_EMAIL_PER_MIN: Joi.number().default(10),
        RATE_LIMIT_RESEND_VERIFICATION_PER_MIN: Joi.number().default(3),
        RATE_LIMIT_FORGOT_PASSWORD_PER_MIN: Joi.number().default(3),
        RATE_LIMIT_RESET_PASSWORD_PER_MIN: Joi.number().default(5),
      }),
    }),
    ScheduleModule.forRoot(),

    // Default rate limit for all routes; auth routes override this with a stricter limit
    // (see AUTH_THROTTLE-style constants in auth.controller.ts).
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: Number(process.env.RATE_LIMIT_DEFAULT_PER_MIN) || 60,
      },
    ]),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DATABASE_HOST'),
        port: config.get<number>('DATABASE_PORT'),
        username: config.get<string>('DATABASE_USER'),
        password: config.get<string>('DATABASE_PASSWORD'),
        database: config.get<string>('DATABASE_NAME'),

        schema: 'public',

        ssl:
          config.get<string>('DATABASE_SSL') === 'true'
            ? { rejectUnauthorized: false }
            : false,

        entities,

        synchronize: config.get<string>('NODE_ENV') !== 'production',
      }),
    }),

    AuthModule,
    UsersModule,
    CompaniesModule,
    CargoPostsModule,
    VehiclePostsModule,
    AdminModule,
    PostsExpirationModule,
    CitiesModule,
    MessagingModule,
    RatingsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: LoggingThrottlerGuard,
    },
  ],
})
export class AppModule {}
