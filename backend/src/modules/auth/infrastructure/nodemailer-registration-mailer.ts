import type { Transporter } from 'nodemailer';

import { env } from '../../../config/env.js';
import type { RegistrationMailSender } from '../application/registration.ports.js';

export class NodemailerRegistrationMailer implements RegistrationMailSender {
  public constructor(private readonly transporter: Transporter) {}

  public async sendVerificationEmail(input: {
    to: string;
    firstName: string;
    verificationToken: string;
  }): Promise<void> {
    await this.transporter.sendMail({
      from: env.MAIL_FROM,
      to: input.to,
      subject: 'Verify your QA Commerce Lab email',
      text: [
        `Hello ${input.firstName},`,
        '',
        'Your account was created and requires email verification.',
        'Use the following one-time token with POST /api/v1/auth/verify-email:',
        '',
        input.verificationToken,
        '',
        'This token expires in 24 hours.',
      ].join('\n'),
    });
  }
}
