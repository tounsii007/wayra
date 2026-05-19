import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface MailOptions {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

/**
 * Mailer with three backends:
 *
 *   MAILER=log       (default) — log to stdout, never send
 *   MAILER=smtp                  — nodemailer SMTP, configured by SMTP_*
 *   MAILER=resend                — Resend HTTP API (RESEND_API_KEY required)
 *
 * The MAILER_FROM env defines the From: address.
 */
@Injectable()
export class MailerService implements OnModuleInit {
  private readonly logger = new Logger(MailerService.name);
  private readonly impl: 'log' | 'smtp' | 'resend';
  private readonly from: string;
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    this.impl = (this.config.get<string>('MAILER') as 'log' | 'smtp' | 'resend') ?? 'log';
    this.from = this.config.get<string>('MAILER_FROM') ?? 'Wayra <noreply@wayra.app>';
  }

  async onModuleInit() {
    if (this.impl === 'smtp') {
      const host = this.config.get<string>('SMTP_HOST');
      const port = Number(this.config.get<string>('SMTP_PORT') ?? '587');
      const user = this.config.get<string>('SMTP_USER');
      const pass = this.config.get<string>('SMTP_PASS');
      if (!host || !user || !pass) {
        this.logger.warn('MAILER=smtp but SMTP_HOST/USER/PASS not set — falling back to log.');
        return;
      }
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      try {
        await this.transporter.verify();
        this.logger.log(`Mailer ready (SMTP via ${host}:${port})`);
      } catch (e) {
        this.logger.error(`SMTP verify failed: ${(e as Error).message}`);
        this.transporter = null;
      }
    }
  }

  async send(opts: MailOptions): Promise<void> {
    if (this.impl === 'smtp' && this.transporter) {
      await this.transporter.sendMail({
        from: this.from,
        to: opts.to,
        subject: opts.subject,
        text: opts.body,
        html: opts.html,
      });
      this.logger.log(`SMTP → ${opts.to}: "${opts.subject}"`);
      return;
    }
    if (this.impl === 'resend') {
      const key = this.config.get<string>('RESEND_API_KEY');
      if (!key) {
        this.logger.warn('MAILER=resend but RESEND_API_KEY is missing — falling back to log.');
      } else {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            from: this.from,
            to: [opts.to],
            subject: opts.subject,
            text: opts.body,
            html: opts.html,
          }),
        });
        if (!res.ok) {
          this.logger.error(`Resend ${res.status}: ${await res.text()}`);
        } else {
          this.logger.log(`Resend → ${opts.to}: "${opts.subject}"`);
          return;
        }
      }
    }
    // Default: log so dev flows still work.
    this.logger.log(
      `\n———————————————\n  TO: ${opts.to}\n  SUBJECT: ${opts.subject}\n\n${opts.body}\n———————————————`,
    );
  }
}
