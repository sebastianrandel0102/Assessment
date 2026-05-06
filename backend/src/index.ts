import dns from 'node:dns';
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import nodemailer from 'nodemailer';
import ContactSupport from './models/ContactSupport';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || '';
const SUPPORT_RECIPIENT = process.env.SUPPORT_RECIPIENT || process.env.EMAIL_USER;
const CONTACT_ROUTES = ['/api/contact', '/api/contact-support'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_DNS_SERVERS = ['10.158.254.133', '10.158.254.132'];

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatEmailMessage(value: string) {
  return escapeHtml(value).replace(/\r?\n/g, '<br />');
}

function buildContactEmailHtml(name: string, email: string, message: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Contact Support Message</title>
</head>
<body style="margin:0; padding:0; min-width:100%; font-family:Aptos, 'Segoe UI', Arial, sans-serif; background:#f7fbff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; background:#eaf6f7; padding:20px 22px 74px;">
    <tr>
      <td align="center">
        <table role="presentation" width="340" cellpadding="0" cellspacing="0" border="0" style="width:340px; max-width:340px; min-height:500px; background:#ffffff; border:2px solid #67b7dc; border-top-color:#7c6ee6; border-right-color:#ff8b7b; border-bottom-color:#70d4b4; border-left-color:#67b7dc; border-radius:8px; box-shadow:0 16px 34px rgba(73, 84, 112, 0.14); overflow:hidden;">
          <tr>
            <td style="padding:34px 32px 42px;">
              <p style="display:block; margin:0 0 92px; padding:0; color:#5c50c8; font-family:'Trebuchet MS', 'Segoe UI', Arial, sans-serif; font-size:11px; font-weight:800; line-height:1.2; text-transform:uppercase;">Live Preview</p>
              <p style="display:block; margin:0 0 82px; padding:0; color:#22283a; font-family:Georgia, 'Times New Roman', serif; font-size:28px; font-weight:700; line-height:1.18; overflow-wrap:break-word; word-wrap:break-word;">${name}</p>
              <p style="display:block; margin:0 0 88px; padding:0; color:#53708a; font-family:Aptos, 'Segoe UI', Arial, sans-serif; font-size:14px; line-height:1.4; overflow-wrap:break-word; word-wrap:break-word;">${email}</p>
              <p style="display:block; margin:0; padding:0; color:#59606f; font-family:Aptos, 'Segoe UI', Arial, sans-serif; font-size:14px; line-height:1.65; overflow-wrap:break-word; word-wrap:break-word;">${message}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function configureDnsServers() {
  const servers = (process.env.DNS_SERVERS || DEFAULT_DNS_SERVERS.join(','))
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);

  if (servers.length > 0) {
    dns.setServers(servers);
  }
}

configureDnsServers();

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.get('/', (_req, res) => {
  res.send('Backend is running!');
});

app.post(CONTACT_ROUTES, async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name?.trim() || !email?.trim() || !message?.trim() || !EMAIL_PATTERN.test(email)) {
      return res.status(400).json({
        error: 'Name, valid email, and message are required.',
      });
    }

    const contactSupport = await ContactSupport.create({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    });

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const previewName = escapeHtml(contactSupport.name);
        const previewEmail = escapeHtml(contactSupport.email);
        const previewMessage = formatEmailMessage(contactSupport.message);

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: SUPPORT_RECIPIENT,
          subject: `New contact support message from ${contactSupport.name}`,
          html: buildContactEmailHtml(previewName, previewEmail, previewMessage),
        });
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
      }
    }

    res.status(201).json({
      message: 'Contact support message saved.',
      data: contactSupport,
    });
  } catch (error) {
    console.error('Contact support error:', error);
    res.status(500).json({
      error: 'Failed to save contact support message.',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
