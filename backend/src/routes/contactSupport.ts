import { createHash, randomInt, randomUUID } from 'node:crypto';
import { Router } from 'express';
import type { Request, Response } from 'express';
import type { Transporter } from 'nodemailer';
import ContactSupport from '../models/ContactSupport';

export const CONTACT_SUPPORT_ROUTE_PATHS = ['/api/contact', '/api/contact-support'];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_EXPIRY_MS = 2 * 60 * 1000;
const VERIFICATION_TOKEN_EXPIRY_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

type ContactSupportPayload = {
  name: string;
  email: string;
  message: string;
};

type ContactSupportRequestBody = Partial<Record<keyof ContactSupportPayload, unknown>>;

type ContactSupportSubmitRequestBody = ContactSupportRequestBody & {
  verificationToken?: unknown;
};

type OtpRequestBody = {
  name?: unknown;
  email?: unknown;
};

type OtpVerifyBody = {
  email?: unknown;
  otp?: unknown;
};

type OtpRecord = {
  attempts: number;
  codeHash: string;
  expiresAt: number;
  nextSendAt: number;
};

type VerifiedEmailRecord = {
  email: string;
  expiresAt: number;
};

type ContactSupportRouterOptions = {
  emailFrom?: string;
  emailTransporter?: Transporter | null;
  supportRecipient?: string;
};

function cleanContactSupportPayload(body: ContactSupportRequestBody): ContactSupportPayload {
  return {
    name: typeof body.name === 'string' ? body.name.trim() : '',
    email: typeof body.email === 'string' ? body.email.trim().toLowerCase() : '',
    message: typeof body.message === 'string' ? body.message.trim() : '',
  };
}

function cleanOtpRequestPayload(body: OtpRequestBody) {
  return {
    name: typeof body.name === 'string' ? body.name.trim() : '',
    email: typeof body.email === 'string' ? body.email.trim().toLowerCase() : '',
  };
}

function cleanOtpVerifyPayload(body: OtpVerifyBody) {
  return {
    email: typeof body.email === 'string' ? body.email.trim().toLowerCase() : '',
    otp: typeof body.otp === 'string' ? body.otp.trim() : '',
  };
}

function isValidContactSupportPayload({ name, email, message }: ContactSupportPayload) {
  return Boolean(name && email && message && EMAIL_PATTERN.test(email));
}

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

function generateOtp() {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

function hashOtp(email: string, otp: string) {
  return createHash('sha256').update(`${email}:${otp}`).digest('hex');
}

function formatRetryAfter(msRemaining: number) {
  return Math.max(1, Math.ceil(msRemaining / 1000));
}

function renderVerificationOtpEmail(name: string, otp: string) {
  const safeName = escapeHtml(name);
  const safeOtp = escapeHtml(otp);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>Email Verification Code</title>
  </head>
  <body style="margin:0; padding:0; width:100%; min-width:320px; background:#f5f7fb; font-family:Aptos, Inter, 'Segoe UI', Arial, sans-serif; color:#263142;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse; background:#f5f7fb;">
      <tr>
        <td align="center" style="padding:36px 18px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:420px; border-collapse:separate; border-spacing:0; background:#ffffff; border:1px solid #dfe4ef; border-top:6px solid #ff8b7b; border-radius:8px; box-shadow:0 24px 58px rgba(73, 84, 112, 0.16); overflow:hidden;">
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 14px; color:#5c50c8; font-size:11px; font-weight:800; line-height:1.2; text-transform:uppercase;">Email Verification</p>
                <h1 style="margin:0 0 18px; color:#22283a; font-family:Georgia, 'Times New Roman', serif; font-size:28px; line-height:1.16;">Hi ${safeName || 'there'},</h1>
                <p style="margin:0 0 20px; color:#59606f; font-size:14px; line-height:1.6;">Use this OTP to verify your email before sending your contact support message.</p>
                <div style="margin:0 0 20px; padding:18px 20px; color:#22283a; background:#eaf6f7; border:2px solid #67b7dc; border-top-color:#7c6ee6; border-right-color:#ff8b7b; border-bottom-color:#70d4b4; border-radius:8px; font-size:30px; font-weight:850; text-align:center;">${safeOtp}</div>
                <p style="margin:0; color:#697083; font-size:13px; line-height:1.5;">This code expires in 2 minutes.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderContactSupportEmail({ name, email, message }: ContactSupportPayload) {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = formatEmailMessage(message);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>New Contact Support Message</title>
  </head>
  <body style="margin:0; padding:0; width:100%; min-width:320px; background:#f5f7fb; font-family:Aptos, Inter, 'Segoe UI', Arial, sans-serif; color:#263142;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
      New support request from ${safeName}.
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse; background:#f5f7fb;">
      <tr>
        <td align="center" style="padding:36px 18px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:460px; border-collapse:separate; border-spacing:0; background:#ffffff; border:1px solid #dfe4ef; border-top:6px solid #ff8b7b; border-radius:8px; box-shadow:0 24px 58px rgba(73, 84, 112, 0.16); overflow:hidden;">
            <tr>
              <td style="padding:24px; background:#ffffff;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:separate; border-spacing:0; background:#eaf6f7; border:1px solid #dfe4ef; border-left:6px solid #70d4b4; border-radius:8px; box-shadow:0 18px 40px rgba(73, 84, 112, 0.09);">
                  <tr>
                    <td align="center" style="padding:20px 22px 74px;">
                      <table role="presentation" width="340" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:340px; min-height:430px; border-collapse:separate; border-spacing:0; background:#ffffff; border:2px solid #67b7dc; border-top-color:#7c6ee6; border-right-color:#ff8b7b; border-bottom-color:#70d4b4; border-left-color:#67b7dc; border-radius:8px; box-shadow:0 16px 34px rgba(73, 84, 112, 0.14); overflow:hidden;">
                        <tr>
                          <td style="padding:34px 32px 42px;">
                            <p style="display:block; margin:0 0 92px; padding:0; color:#5c50c8; font-family:'Trebuchet MS', Aptos, 'Segoe UI', Arial, sans-serif; font-size:11px; font-weight:800; line-height:1.2; text-transform:uppercase;">
                              Live Preview
                            </p>
                            <p style="display:block; margin:0 0 82px; padding:0; color:#22283a; font-family:Georgia, 'Times New Roman', serif; font-size:28px; font-weight:700; line-height:1.18; overflow-wrap:anywhere; word-break:break-word;">
                              ${safeName}
                            </p>
                            <p style="display:block; margin:0 0 88px; padding:0; color:#53708a; font-family:Aptos, 'Segoe UI', Arial, sans-serif; font-size:14px; line-height:1.4; overflow-wrap:anywhere; word-break:break-word;">
                              <a href="mailto:${safeEmail}" style="color:#53708a; text-decoration:none;">${safeEmail}</a>
                            </p>
                            <p style="display:block; margin:0; padding:0; color:#59606f; font-family:Aptos, 'Segoe UI', Arial, sans-serif; font-size:14px; line-height:1.65; overflow-wrap:anywhere; word-break:break-word;">
                              ${safeMessage}
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function sendContactSupportEmail(
  contactSupport: ContactSupportPayload & { emailLayoutHtml: string },
  { emailFrom, emailTransporter, supportRecipient }: ContactSupportRouterOptions
) {
  if (!emailFrom || !emailTransporter || !supportRecipient) {
    return;
  }

  await emailTransporter.sendMail({
    from: emailFrom,
    to: supportRecipient,
    subject: `New contact support message from ${contactSupport.name}`,
    html: contactSupport.emailLayoutHtml,
  });
}

async function sendVerificationOtpEmail(
  { email, name, otp }: { email: string; name: string; otp: string },
  { emailFrom, emailTransporter }: ContactSupportRouterOptions
) {
  if (!emailFrom || !emailTransporter) {
    throw new Error('Email verification is not configured.');
  }

  await emailTransporter.sendMail({
    from: emailFrom,
    to: email,
    subject: 'Your contact support verification code',
    html: renderVerificationOtpEmail(name, otp),
  });
}

export function createContactSupportRouter(options: ContactSupportRouterOptions = {}) {
  const router = Router();
  const otpRequests = new Map<string, OtpRecord>();
  const verifiedEmails = new Map<string, VerifiedEmailRecord>();

  function cleanupExpiredRecords(now = Date.now()) {
    for (const [email, record] of otpRequests.entries()) {
      if (record.expiresAt <= now) {
        otpRequests.delete(email);
      }
    }

    for (const [token, record] of verifiedEmails.entries()) {
      if (record.expiresAt <= now) {
        verifiedEmails.delete(token);
      }
    }
  }

  router.post('/otp/request', async (req: Request, res: Response) => {
    const now = Date.now();
    cleanupExpiredRecords(now);

    const otpPayload = cleanOtpRequestPayload((req.body ?? {}) as OtpRequestBody);

    if (!otpPayload.name || !EMAIL_PATTERN.test(otpPayload.email)) {
      return res.status(400).json({
        error: 'Name and a valid email are required before verification.',
      });
    }

    const existingOtp = otpRequests.get(otpPayload.email);

    if (existingOtp && existingOtp.nextSendAt > now) {
      return res.status(429).json({
        error: 'Please wait before requesting another OTP.',
        retryAfterSeconds: formatRetryAfter(existingOtp.nextSendAt - now),
      });
    }

    const otp = generateOtp();

    otpRequests.set(otpPayload.email, {
      attempts: 0,
      codeHash: hashOtp(otpPayload.email, otp),
      expiresAt: now + OTP_EXPIRY_MS,
      nextSendAt: now + OTP_EXPIRY_MS,
    });

    try {
      await sendVerificationOtpEmail({ ...otpPayload, otp }, options);
    } catch (error) {
      otpRequests.delete(otpPayload.email);
      console.error('OTP email failed:', error);

      return res.status(500).json({
        error: 'Failed to send OTP email.',
      });
    }

    return res.status(200).json({
      message: 'Verification OTP sent.',
      expiresInSeconds: OTP_EXPIRY_MS / 1000,
      retryAfterSeconds: OTP_EXPIRY_MS / 1000,
    });
  });

  router.post('/otp/verify', (req: Request, res: Response) => {
    const now = Date.now();
    cleanupExpiredRecords(now);

    const otpPayload = cleanOtpVerifyPayload((req.body ?? {}) as OtpVerifyBody);

    if (!EMAIL_PATTERN.test(otpPayload.email) || !/^\d{6}$/.test(otpPayload.otp)) {
      return res.status(400).json({
        error: 'A valid email and 6-digit OTP are required.',
      });
    }

    const otpRecord = otpRequests.get(otpPayload.email);

    if (!otpRecord) {
      return res.status(400).json({
        error: 'OTP expired. Request a new code.',
      });
    }

    if (otpRecord.codeHash !== hashOtp(otpPayload.email, otpPayload.otp)) {
      otpRecord.attempts += 1;

      if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
        otpRequests.delete(otpPayload.email);

        return res.status(429).json({
          error: 'Too many OTP attempts. Request a new code.',
        });
      }

      return res.status(400).json({
        error: 'Invalid OTP code.',
      });
    }

    otpRequests.delete(otpPayload.email);

    const verificationToken = randomUUID();
    verifiedEmails.set(verificationToken, {
      email: otpPayload.email,
      expiresAt: now + VERIFICATION_TOKEN_EXPIRY_MS,
    });

    return res.status(200).json({
      message: 'Email verified.',
      verificationToken,
      verifiedEmail: otpPayload.email,
    });
  });

  router.post('/', async (req: Request, res: Response) => {
    try {
      const contactPayload = cleanContactSupportPayload(
        (req.body ?? {}) as ContactSupportRequestBody
      );
      const verificationToken =
        typeof (req.body as ContactSupportSubmitRequestBody | undefined)?.verificationToken ===
        'string'
          ? ((req.body as ContactSupportSubmitRequestBody).verificationToken as string).trim()
          : '';

      if (!isValidContactSupportPayload(contactPayload)) {
        return res.status(400).json({
          error: 'Name, valid email, and message are required.',
        });
      }

      cleanupExpiredRecords();

      const verifiedEmailRecord = verifiedEmails.get(verificationToken);

      if (!verifiedEmailRecord || verifiedEmailRecord.email !== contactPayload.email) {
        return res.status(403).json({
          error: 'Please verify your email before sending.',
        });
      }

      const contactSupport = await ContactSupport.create({
        ...contactPayload,
        emailLayoutHtml: renderContactSupportEmail(contactPayload),
        emailVerifiedAt: new Date(),
      });

      try {
        await sendContactSupportEmail(contactSupport, options);
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
      }

      verifiedEmails.delete(verificationToken);

      return res.status(201).json({
        message: 'Contact support message saved.',
        data: contactSupport,
      });
    } catch (error) {
      console.error('Contact support error:', error);

      return res.status(500).json({
        error: 'Failed to save contact support message.',
      });
    }
  });

  return router;
}
