const DEFAULT_SUBJECT = "DELE A2 REVIEW COURSE";
const DEFAULT_REPLY_TO = "apoyofilipino@gmail.com";

export type StudentAutoReplyParams = {
  firstName?: string;
  subject?: string;
};

export type StudentAutoReplyEmail = {
  subject: string;
  html: string;
  text: string;
  replyTo: string;
};

export type AdminNotificationParams = {
  plan: string;
  fullName: string;
  email: string;
  whatsapp?: string;
  notes?: string;
  subject?: string;
  receiptLink?: string;
  createdAt?: string;
};

export type AdminNotificationEmail = {
  subject: string;
  html: string;
  text: string;
};

export function buildStudentAutoReplyEmail(
  params: StudentAutoReplyParams = {}
): StudentAutoReplyEmail {
  const firstName = normalizeFirstName(params.firstName);
  const courseSubject = normalizeSubject(params.subject);
  const subject = `Enrollment Received \u2014 ${courseSubject}`;

  const text = `Hi ${firstName},

Thanks for enrolling in the DELE A2 Review Course \u2014 we\u2019ve received your form submission and proof of payment.

What happens next:
\u2022 Our team will review your details and receipt.
\u2022 You\u2019ll receive a follow-up email within 12\u201324 hours with your access instructions.

If you have any questions, just reply to this email \u2014 your reply will go directly to our team.

\u2013 ApoyoFilipino`;

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#ffe4f4;font-family:Arial,Helvetica,sans-serif;color:#311222;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffe4f4;padding:28px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:680px;background:rgba(255,255,255,0.92);border:1px solid rgba(155,0,87,0.18);border-radius:20px;box-shadow:0 18px 44px rgba(155,0,87,0.16);overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 14px;">
                <span style="display:inline-block;padding:8px 12px;border-radius:999px;border:1px solid rgba(155,0,87,0.2);color:#9b0057;background:rgba(255,255,255,0.8);font-size:12px;font-weight:700;letter-spacing:0.04em;">ApoyoFilipino</span>
                <h1 style="margin:16px 0 12px;color:#9b0057;font-size:28px;line-height:1.2;">Enrollment received \u2705</h1>
                <p style="margin:0 0 14px;font-size:16px;line-height:1.65;">Hi ${escapeHtml(firstName)},</p>
                <p style="margin:0 0 14px;font-size:16px;line-height:1.65;">Thanks for enrolling in the DELE A2 Review Course \u2014 we\u2019ve received your form submission and proof of payment.</p>
                <p style="margin:0 0 10px;font-size:16px;line-height:1.65;"><strong>What happens next:</strong></p>
                <ul style="margin:0 0 14px 18px;padding:0;">
                  <li style="margin:0 0 8px;font-size:16px;line-height:1.6;">Our team will review your details and receipt.</li>
                  <li style="margin:0;font-size:16px;line-height:1.6;">You\u2019ll receive a follow-up email within 12\u201324 hours with your access instructions.</li>
                </ul>
                <p style="margin:0 0 16px;font-size:16px;line-height:1.65;">If you have any questions, just reply to this email \u2014 your reply will go directly to our team.</p>
                <p style="margin:0 0 18px;font-size:16px;line-height:1.65;">\u2013 ApoyoFilipino</p>
                <p style="margin:0;padding-top:14px;border-top:1px solid rgba(155,0,87,0.16);font-size:13px;color:#6f3753;">Subject: ${escapeHtml(
                  courseSubject
                )}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return {
    subject,
    html,
    text,
    replyTo: DEFAULT_REPLY_TO,
  };
}

export function buildAdminNotificationEmail(
  params: AdminNotificationParams
): AdminNotificationEmail {
  const plan = safeValue(params.plan);
  const fullName = safeValue(params.fullName);
  const email = safeValue(params.email);
  const whatsapp = safeValue(params.whatsapp, "-");
  const notes = safeValue(params.notes, "-");
  const subjectValue = normalizeSubject(params.subject);
  const receiptLink = safeValue(params.receiptLink, "(no receipt link generated)");
  const createdAt = safeValue(params.createdAt, new Date().toISOString());
  const subject = `New Enrollment \u2014 ${plan} \u2014 ${fullName}`;

  const text = `New Enrollment Received

Plan: ${plan}
Full Name: ${fullName}
Email: ${email}
WhatsApp: ${whatsapp}
Notes: ${notes}
Subject: ${subjectValue}

Receipt: ${receiptLink}

Created At: ${createdAt}`;

  const safeReceiptHref =
    receiptLink === "(no receipt link generated)" ? "" : escapeHtml(receiptLink);

  const receiptHtml = safeReceiptHref
    ? `<a href="${safeReceiptHref}" target="_blank" rel="noopener noreferrer">${escapeHtml(
        receiptLink
      )}</a>`
    : escapeHtml(receiptLink);

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#ffe4f4;font-family:Arial,Helvetica,sans-serif;color:#311222;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffe4f4;padding:24px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:760px;background:#ffffff;border:1px solid rgba(155,0,87,0.16);border-radius:16px;box-shadow:0 14px 38px rgba(155,0,87,0.12);">
            <tr>
              <td style="padding:24px;">
                <h2 style="margin:0 0 16px;color:#9b0057;font-size:26px;line-height:1.2;">New Enrollment Received</h2>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                  <tr><td style="padding:9px 0;border-bottom:1px solid rgba(155,0,87,0.1);font-weight:700;">Plan</td><td style="padding:9px 0;border-bottom:1px solid rgba(155,0,87,0.1);">${escapeHtml(
                    plan
                  )}</td></tr>
                  <tr><td style="padding:9px 0;border-bottom:1px solid rgba(155,0,87,0.1);font-weight:700;">Full Name</td><td style="padding:9px 0;border-bottom:1px solid rgba(155,0,87,0.1);">${escapeHtml(
                    fullName
                  )}</td></tr>
                  <tr><td style="padding:9px 0;border-bottom:1px solid rgba(155,0,87,0.1);font-weight:700;">Email</td><td style="padding:9px 0;border-bottom:1px solid rgba(155,0,87,0.1);">${escapeHtml(
                    email
                  )}</td></tr>
                  <tr><td style="padding:9px 0;border-bottom:1px solid rgba(155,0,87,0.1);font-weight:700;">WhatsApp</td><td style="padding:9px 0;border-bottom:1px solid rgba(155,0,87,0.1);">${escapeHtml(
                    whatsapp
                  )}</td></tr>
                  <tr><td style="padding:9px 0;border-bottom:1px solid rgba(155,0,87,0.1);font-weight:700;">Notes</td><td style="padding:9px 0;border-bottom:1px solid rgba(155,0,87,0.1);">${escapeHtml(
                    notes
                  )}</td></tr>
                  <tr><td style="padding:9px 0;border-bottom:1px solid rgba(155,0,87,0.1);font-weight:700;">Subject</td><td style="padding:9px 0;border-bottom:1px solid rgba(155,0,87,0.1);">${escapeHtml(
                    subjectValue
                  )}</td></tr>
                  <tr><td style="padding:9px 0;border-bottom:1px solid rgba(155,0,87,0.1);font-weight:700;">Receipt</td><td style="padding:9px 0;border-bottom:1px solid rgba(155,0,87,0.1);">${receiptHtml}</td></tr>
                  <tr><td style="padding:9px 0 0;font-weight:700;">Created At</td><td style="padding:9px 0 0;">${escapeHtml(
                    createdAt
                  )}</td></tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return {
    subject,
    html,
    text,
  };
}

function normalizeFirstName(value?: string): string {
  const clean = safeValue(value);
  if (!clean || clean === "-") return "there";
  return clean.split(/\s+/)[0] || "there";
}

function normalizeSubject(value?: string): string {
  const clean = safeValue(value);
  return clean && clean !== "-" ? clean : DEFAULT_SUBJECT;
}

function safeValue(value?: string, fallback = "-"): string {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function escapeHtml(value: string): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
