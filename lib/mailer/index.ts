import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT || '587'),
  secure: process.env.MAIL_PORT === '465',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export function sendMail({
  to,
  cc,
  subject,
  text,
  html,
  sendCopy,
  attachments,
}: {
  to: string | string[];
  cc?: string | string[];
  subject: string;
  text: string;
  html?: string;
  sendCopy?: boolean;
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }[];
}) {
  return transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    cc,
    bcc: sendCopy ? process.env.MAIL_FROM : undefined,
    subject,
    text,
    html,
    attachments,
  });
}
