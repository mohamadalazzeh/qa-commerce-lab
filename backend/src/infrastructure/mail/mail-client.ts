import nodemailer from 'nodemailer';

import { env } from '../../config/env.js';

export const mailTransporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
});

export async function verifyMailTransport(): Promise<void> {
  await mailTransporter.verify();
}
