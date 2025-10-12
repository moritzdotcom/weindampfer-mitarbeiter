import { sendMail } from '@/lib/mailer';

export default function sendEventCanceledMail(
  emails: string[],
  eventName: string,
  eventDate: string
) {
  return sendMail({
    to: emails,
    cc: [
      'sk@km-entertainment.de',
      'ml@km-entertainment.de',
      'nm@km-entertainment.de',
    ],
    subject: `Event wurde abgesagt: ${eventName}`,
    text: `Hallo, leider müssen wir das Event (${eventName} am ${eventDate}) absagen.`,
    html: `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <title>Neues Event</title>
</head>
<body style="margin:0; padding:0; font-family:Arial,sans-serif; background-color:#f9f9f9;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; margin:20px 0; border-radius:8px; overflow:hidden;">
          <!-- Logo -->
          <tr>
            <td style="padding:20px; text-align:center;">
              <img src="${
                process.env.PUBLIC_URL
              }logo-black.png" alt="Weindampfer Logo" style="max-width:200px; height:auto;" />
            </td>
          </tr>
          <!-- Überschrift -->
          <tr>
            <td style="padding:0 20px 10px;">
              <h1 style="margin:0; font-size:24px; color:#333333; text-align:center;">
                ${eventName} abgesagt
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 20px;">
              <div style="background-color:#f0f0f0; padding:20px; border-radius:5px; color:#333333; font-size:16px; line-height:1.5;">
                <p>Hallo,</p>
                <p>Leider müssen wir das Event (<strong>${eventName}</strong> am <strong>${eventDate}</strong>) absagen.</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 20px 20px; color:#333333; font-size:14px; line-height:1.5;">
              Liebe Grüße<br/>
              Dein Weindampfer-Team
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#000000; padding:15px; text-align:center;">
              <p style="margin:0; font-size:12px; color:#ffffff;">
                © ${new Date().getFullYear()} Weindampfer - Alle Rechte vorbehalten
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
}
