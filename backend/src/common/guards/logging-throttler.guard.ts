import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';
import type { Request } from 'express';

// Same throttling behavior as the stock ThrottlerGuard, just with a log line when a
// client actually gets rate-limited — useful for spotting brute-force/scripted abuse
// against auth endpoints (section 9's "rate-limit triggers" logging requirement).
@Injectable()
export class LoggingThrottlerGuard extends ThrottlerGuard {
  private readonly rateLimitLogger = new Logger('RateLimit');

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const request = context.switchToHttp().getRequest<Request>();
    this.rateLimitLogger.warn(
      `Rate limit exceeded: ${request.method} ${request.originalUrl || request.url} from ${request.ip}`,
    );
    return super.throwThrottlingException(context, throttlerLimitDetail);
  }
}
