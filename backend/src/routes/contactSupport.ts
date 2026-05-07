import { Router } from 'express';
import type { Request, Response } from 'express';
import type { Transporter } from 'nodemailer';
import ContactSupport from '../models/ContactSupport';

export const CONTACT_SUPPORT_ROUTE_PATHS = ['/api/contact', '/api/contact-support'];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ContactSupportPayload = {
  name: string;
  email: string;
  message: string;
};

type ContactSupportRequestBody = Partial<Record<keyof ContactSupportPayload, unknown>>;

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

export function createContactSupportRouter(options: ContactSupportRouterOptions = {}) {
  const router = Router();

  router.post('/', async (req: Request, res: Response) => {
    try {
      const contactPayload = cleanContactSupportPayload(
        (req.body ?? {}) as ContactSupportRequestBody
      );

      if (!isValidContactSupportPayload(contactPayload)) {
        return res.status(400).json({
          error: 'Name, valid email, and message are required.',
        });
      }

      const contactSupport = await ContactSupport.create({
        ...contactPayload,
        emailLayoutHtml: renderContactSupportEmail(contactPayload),
      });

      try {
        await sendContactSupportEmail(contactSupport, options);
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
      }

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
