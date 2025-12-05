require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const nodemailer = require('nodemailer');

(async () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const fromName = process.env.SMTP_FROM_NAME || 'Eco Presents';
  const fromEmail = process.env.SMTP_FROM || user;
  const to = process.env.TEST_TO || process.env.ADMIN_EMAIL || user;

  if (!host || !port || !user || !pass || !fromEmail) {
    console.error('Missing SMTP env vars. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });

  try {
    await transporter.verify();
    console.log('SMTP connection verified');
    const info = await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject: 'Test Email from Eco Presents',
      text: 'Hello from Eco Presents SMTP test. If you see this, SMTP works.',
    });
    console.log('Sent. MessageId:', info.messageId);
  } catch (e) {
    console.error('SMTP test failed:', e.message);
    process.exit(1);
  }
})();
