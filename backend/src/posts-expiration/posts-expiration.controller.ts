import {
  Controller,
  Get,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle } from '@nestjs/throttler';
import { PostsExpirationService } from './posts-expiration.service';

// Invoked once a day by Vercel Cron (schedule declared in backend/vercel.json).
// Vercel issues a GET request and, when a CRON_SECRET env var is set on the
// project, adds an `Authorization: Bearer <CRON_SECRET>` header. We reject anything
// that doesn't match so the route can't be triggered by the public internet.
//
// This exists because @nestjs/schedule's in-process @Cron timer does not fire
// reliably on Vercel's serverless functions — see PostsExpirationService.
@Controller('internal/cron')
export class PostsExpirationController {
  constructor(
    private readonly postsExpiration: PostsExpirationService,
    private readonly config: ConfigService,
  ) {}

  @Get('expire-posts')
  @SkipThrottle()
  async expirePosts(@Headers('authorization') auth?: string) {
    const secret = this.config.get<string>('CRON_SECRET');
    if (!secret || auth !== `Bearer ${secret}`) {
      throw new UnauthorizedException();
    }
    return this.postsExpiration.expireOldPosts();
  }
}
