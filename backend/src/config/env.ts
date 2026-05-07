import dns from 'node:dns';
import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: process.env.PORT || '5000',
  mongoUri: process.env.MONGO_URI || '',
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  supportRecipient: process.env.SUPPORT_RECIPIENT || process.env.EMAIL_USER,
};

export function configureDnsServers() {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}
