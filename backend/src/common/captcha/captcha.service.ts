import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
}

const TURNSTILE_VERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);
  private readonly secretKey: string;
  private readonly isProduction: boolean;

  constructor(private readonly configService: ConfigService) {
    this.secretKey =
      this.configService.get<string>('TURNSTILE_SECRET_KEY') || '';
    this.isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
  }

  // Verifies a Cloudflare Turnstile token server-side. Never trust a client-side-only
  // check. Mirrors the OpenRouteService pattern used elsewhere in this codebase: an
  // unconfigured secret degrades gracefully in development (so the app is usable without
  // real Turnstile keys locally) but fails closed in production — a missing secret there
  // must never silently disable bot protection.
  async verify(
    token: string | undefined | null,
    ip?: string,
  ): Promise<boolean> {
    if (!this.secretKey) {
      if (this.isProduction) {
        this.logger.error(
          'TURNSTILE_SECRET_KEY is not set in production — rejecting captcha verification',
        );
        return false;
      }
      this.logger.warn(
        'TURNSTILE_SECRET_KEY not set — bypassing captcha verification (development only)',
      );
      return true;
    }

    if (!token) {
      return false;
    }

    try {
      const params = new URLSearchParams();
      params.append('secret', this.secretKey);
      params.append('response', token);
      if (ip) params.append('remoteip', ip);

      const response = await axios.post<TurnstileVerifyResponse>(
        TURNSTILE_VERIFY_URL,
        params,
        { timeout: 10_000 },
      );

      if (!response.data.success) {
        this.logger.warn(
          `Captcha verification failed: ${(response.data['error-codes'] || []).join(', ')}`,
        );
      }
      return response.data.success === true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Captcha verification request failed: ${message}`);
      // Fail closed — a network error talking to Turnstile must not be treated as a pass.
      return false;
    }
  }
}
