import dns from 'node:dns';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_DNS_SERVERS = ['10.158.254.133', '10.158.254.132'];

export const env = {
  port: process.env.PORT || '5000',
  mongoUri: process.env.MONGO_URI || '',
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  supportRecipient: process.env.SUPPORT_RECIPIENT || process.env.EMAIL_USER,
  dnsServers: (process.env.DNS_SERVERS || DEFAULT_DNS_SERVERS.join(','))
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean),
};

export function configureDnsServers() {
  if (env.dnsServers.length > 0) {
    dns.setServers(env.dnsServers);
  }
}
