import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface MailOptions {
  to: string;
  subject: string;
  body: string;
}

/**
 * Tiny mailer abstraction.
 *
 * MVP: logs the message to stdout so password-reset / email-verification
 * flows are end-to-end testable without an SMTP server.
 *
 * Production: replace `send()` with a Postmark / SendGrid / SES call. The
 * `MAILER` env var lets you flip implementations without touching callers.
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly impl: 'log' | 'real';

  constructor(private readonly config: ConfigService) {
    this.impl = (this.config.get<string>('MAILER') as 'log' | 'real') ?? 'log';
  }

  async send(opts: MailOptions): Promise<void> {
    if (this.impl === 'real') {
      // Production swap:
      //   const client = new ServerClient(process.env.POSTMARK_TOKEN!);
      //   await client.sendEmail({ From: ..., To: opts.to, Subject: opts.subject, TextBody: opts.body });
      this.logger.warn(`MAILER=real not implemented yet; falling back to log for ${opts.to}`);
    }
    this.logger.log(
      `\n———————————————\n  TO: ${opts.to}\n  SUBJECT: ${opts.subject}\n\n${opts.body}\n———————————————`,
    );
  }
}
