import cors from 'cors';
import express from 'express';
import { configureDnsServers, env } from './config/env';
import { connectDatabase } from './config/database';
import { createEmailTransporter } from './services/emailTransporter';
import {
  CONTACT_SUPPORT_ROUTE_PATHS,
  createContactSupportRouter,
} from './routes/contactSupport';

configureDnsServers();
void connectDatabase();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Backend is running!');
});

app.use(
  CONTACT_SUPPORT_ROUTE_PATHS,
  createContactSupportRouter({
    emailFrom: env.emailUser,
    emailTransporter: createEmailTransporter(),
    supportRecipient: env.supportRecipient,
  })
);

export default app;
