import nodemailer from 'nodemailer';
import { env } from '../config/env';

export function createEmailTransporter() {
  if (!env.emailUser || !env.emailPass) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: env.emailUser,
      pass: env.emailPass,
    },
  });
}
