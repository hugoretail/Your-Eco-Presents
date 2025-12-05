import nodemailer from 'nodemailer';

type MailInput = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  fromOverride?: string;
};

function getFromAddress() {
  const name = process.env.SMTP_FROM_NAME?.trim();
  const email = process.env.SMTP_FROM?.trim();
  if (email && name) return `${name} <${email}>`;
  if (email) return email;
  return 'no-reply@localhost';
}

function isSmtpConfigured() {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

export async function sendMail({ to, subject, html, text, fromOverride }: MailInput) {
  if (!isSmtpConfigured()) {
    // Fallback: log to server console in development if SMTP is not configured
    console.warn('[mailer] SMTP not configured. Logging email locally.');
    console.info({ to, subject, html, text });
    return { ok: false, logged: true };
  }

  const host = process.env.SMTP_HOST as string;
  const port = parseInt(process.env.SMTP_PORT as string, 10) || 587;
  const user = process.env.SMTP_USER as string;
  const pass = process.env.SMTP_PASS as string;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  const from = fromOverride || getFromAddress();

  const info = await transporter.sendMail({ from, to, subject, html, text });
  return { ok: true, messageId: info.messageId };
}

export async function verifySmtpConnection() {
  if (!isSmtpConfigured()) return { ok: false, reason: 'not-configured' };
  const host = process.env.SMTP_HOST as string;
  const port = parseInt(process.env.SMTP_PORT as string, 10) || 587;
  const user = process.env.SMTP_USER as string;
  const pass = process.env.SMTP_PASS as string;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
  await transporter.verify();
  return { ok: true };
}
