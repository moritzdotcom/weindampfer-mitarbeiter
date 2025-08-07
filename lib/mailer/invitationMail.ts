import { sendMail } from '@/lib/mailer';

export default function sendInvitationMail(
  email: string,
  inviteId: string,
  name: string
) {
  return sendMail({
    to: email,
    sendCopy: true,
    subject: 'Wilkommen an Bord des Weindampfers!',
    text: `Hallo ${name}, Du wurdest eingeladen, dem Weindampfer Schichtplan beizutreten. Bitte registriere dich über den folgenden Link: ${process.env.PUBLIC_URL}auth/signup?inviteId=${inviteId}`,
    html: `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <title>Wilkommen an Bord</title>
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
                Wilkommen an Bord des Weindampfers!
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 20px;">
              <div style="background-color:#f0f0f0; padding:20px; border-radius:5px; color:#333333; font-size:16px; line-height:1.5;">
                <p>Hallo <strong>${name}</strong>,</p>
                <p>Du wurdest eingeladen, dem Weindampfer Schichtplan beizutreten. Bitte registriere dich über den folgenden Link:</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 20px;">
              <div style="background-color: #ffffff; padding: 20px; border-radius: 5px; color: #000000; font-size: 16px; line-height: 1.5; text-align: center;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                  <tr>
                    <td>
                      <a href="${
                        process.env.PUBLIC_URL
                      }auth/signup?inviteId=${inviteId}" style="display: inline-block; background-color: #000000; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                        Jetzt registrieren
                      </a>
                    </td>
                  </tr>
                </table>
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
