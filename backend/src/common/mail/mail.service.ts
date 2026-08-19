import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly isProduction: boolean;
  private readonly fromAddress: string;
  private transporter: Transporter | null = null;
  private readonly configured: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    this.fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      'CargoConnect <no-reply@cargoconnect.local>';

    const host = this.configService.get<string>('SMTP_HOST');
    this.configured = Boolean(host);

    if (this.configured) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.configService.get<number>('SMTP_PORT') || 587,
        secure: this.configService.get<number>('SMTP_PORT') === 465,
        auth: this.configService.get<string>('SMTP_USER')
          ? {
              user: this.configService.get<string>('SMTP_USER'),
              pass: this.configService.get<string>('SMTP_PASSWORD'),
            }
          : undefined,
      });
    }
  }

  // Every auth flow that needs email routes through here. In production, an unconfigured
  // SMTP setup is a hard failure (per explicit product requirement — never silently pretend
  // an email was sent). In development, it falls back to logging the message to the console
  // — same graceful-degradation shape as OpenRouteService — so the verification/reset link
  // is still reachable by a developer without real SMTP credentials.
  private async send(options: SendMailOptions): Promise<void> {
    if (!this.configured || !this.transporter) {
      if (this.isProduction) {
        this.logger.error(
          'SMTP is not configured — cannot send email in production',
        );
        throw new InternalServerErrorException(
          'Email service is not available. Please try again later.',
        );
      }
      this.logger.warn(
        `SMTP not configured — logging email instead of sending (development only)\n` +
          `To: ${options.to}\nSubject: ${options.subject}\n${options.text}`,
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to send email to ${options.to}: ${message}`);
      throw new InternalServerErrorException(
        'Email service is not available. Please try again later.',
      );
    }
  }

  async sendVerificationEmail(
    to: string,
    firstName: string,
    verifyUrl: string,
  ): Promise<void> {
    await this.send({
      to,
      subject: 'Potvrdite svoju e-mail adresu — CargoConnect',
      text:
        `Pozdrav ${firstName},\n\n` +
        `Hvala na registraciji na CargoConnect. Potvrdite svoju e-mail adresu klikom na sljedeći link:\n\n` +
        `${verifyUrl}\n\n` +
        `Link vrijedi ograničeno vrijeme. Ako niste vi zatražili registraciju, slobodno zanemarite ovaj e-mail.`,
      html:
        `<p>Pozdrav ${firstName},</p>` +
        `<p>Hvala na registraciji na CargoConnect. Potvrdite svoju e-mail adresu klikom na sljedeći link:</p>` +
        `<p><a href="${verifyUrl}">${verifyUrl}</a></p>` +
        `<p>Link vrijedi ograničeno vrijeme. Ako niste vi zatražili registraciju, slobodno zanemarite ovaj e-mail.</p>`,
    });
  }

  async sendPasswordResetEmail(
    to: string,
    firstName: string,
    resetUrl: string,
  ): Promise<void> {
    await this.send({
      to,
      subject: 'Resetiranje lozinke — CargoConnect',
      text:
        `Pozdrav ${firstName},\n\n` +
        `Zatražili ste resetiranje lozinke. Kliknite na link ispod da postavite novu lozinku:\n\n` +
        `${resetUrl}\n\n` +
        `Link vrijedi ograničeno vrijeme i može se koristiti samo jednom. ` +
        `Ako niste vi zatražili resetiranje lozinke, slobodno zanemarite ovaj e-mail — vaša lozinka ostaje nepromijenjena.`,
      html:
        `<p>Pozdrav ${firstName},</p>` +
        `<p>Zatražili ste resetiranje lozinke. Kliknite na link ispod da postavite novu lozinku:</p>` +
        `<p><a href="${resetUrl}">${resetUrl}</a></p>` +
        `<p>Link vrijedi ograničeno vrijeme i može se koristiti samo jednom. ` +
        `Ako niste vi zatražili resetiranje lozinke, slobodno zanemarite ovaj e-mail — vaša lozinka ostaje nepromijenjena.</p>`,
    });
  }

  async sendDuplicateRegistrationNotice(
    to: string,
    firstName: string,
    forgotPasswordUrl: string,
  ): Promise<void> {
    await this.send({
      to,
      subject: 'Pokušaj registracije s vašom e-mail adresom — CargoConnect',
      text:
        `Pozdrav ${firstName},\n\n` +
        `Netko je pokušao otvoriti novi račun na CargoConnect koristeći vašu e-mail adresu, ` +
        `no račun s ovom adresom već postoji.\n\n` +
        `Ako ste to bili vi i zaboravili ste lozinku, možete je resetirati ovdje:\n${forgotPasswordUrl}\n\n` +
        `Ako niste vi, slobodno zanemarite ovaj e-mail.`,
      html:
        `<p>Pozdrav ${firstName},</p>` +
        `<p>Netko je pokušao otvoriti novi račun na CargoConnect koristeći vašu e-mail adresu, ` +
        `no račun s ovom adresom već postoji.</p>` +
        `<p>Ako ste to bili vi i zaboravili ste lozinku, možete je resetirati ` +
        `<a href="${forgotPasswordUrl}">ovdje</a>.</p>` +
        `<p>Ako niste vi, slobodno zanemarite ovaj e-mail.</p>`,
    });
  }
}
