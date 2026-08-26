import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

function getTransporter() {
  const host = process.env.SMTP_HOST || process.env.EMAIL_SERVER_HOST;
  const user = process.env.SMTP_USER || process.env.EMAIL_SERVER_USER;
  let pass = process.env.SMTP_PASS || process.env.EMAIL_SERVER_PASSWORD;
  const port = Number(process.env.SMTP_PORT || process.env.EMAIL_SERVER_PORT || 587);

  if (!host || !user || !pass) {
    return null;
  }

  pass = pass.replace(/\s+/g, '');

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: {
      // TLS certificate verification stays on unless explicitly disabled
      // (e.g. for a self-signed internal relay) via SMTP_ALLOW_INSECURE_TLS=1.
      rejectUnauthorized: process.env.SMTP_ALLOW_INSECURE_TLS !== '1',
    },
  });
}

/** Escapes user-controlled text before interpolating it into HTML emails. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
  const transporter = getTransporter();
  const user = process.env.SMTP_USER || process.env.EMAIL_SERVER_USER || '';
  const defaultFrom = user ? `"VCET NSDC" <${user}>` : '"VCET NSDC" <noreply@vcetnsdc.com>';
  const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || defaultFrom;

  if (!transporter) {
    console.log(`[Email Service (Dev Simulation)] Would send email to: ${to}`);
    console.log(`[Subject]: ${subject}`);
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    console.log(`[Email Sent] Successfully delivered to ${to}, messageId: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error(`[Email Error] Failed to send email to ${to}:`, err);
    return false;
  }
}

/**
 * Send notification when participant submits event registration form
 */
export async function sendRegistrationSubmissionEmail({
  email,
  name,
  squadName,
  eventTitle,
}: {
  email: string;
  name: string;
  squadName: string;
  eventTitle: string;
}) {
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #0d0d18; color: #ffffff; padding: 30px; borderRadius: 16px; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #a855f7; font-size: 26px; margin: 0;">VCET NSDC</h1>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">Registration Submission Received</p>
      </div>

      <div style="background-color: #161626; border: 1px solid #334155; padding: 25px; border-radius: 12px;">
        <h2 style="color: #ffffff; font-size: 20px; margin-top: 0;">Hello ${escapeHtml(name)},</h2>
        <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6;">
          Your registration for <strong style="color: #c084fc;">${escapeHtml(eventTitle)}</strong> (Squad: <strong style="color: #38bdf8;">${escapeHtml(squadName)}</strong>) has been successfully received and is currently under review by our admin team.
        </p>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          We are verifying your submission and payment proof. You will receive an official confirmation email once your squad is approved.
        </p>
      </div>

      <div style="text-align: center; margin-top: 25px; color: #64748b; font-size: 12px;">
        <p>© ${new Date().getFullYear()} VCET NSDC. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `[Received] Registration Submission for ${eventTitle}`,
    html,
  });
}

/**
 * Send notification when admin approves event registration
 */
export async function sendRegistrationApprovedEmail({
  email,
  name,
  squadName,
  eventTitle,
}: {
  email: string;
  name: string;
  squadName: string;
  eventTitle: string;
}) {
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #0d0d18; color: #ffffff; padding: 30px; borderRadius: 16px; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #10b981; font-size: 26px; margin: 0;">🎉 Registration Approved!</h1>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">VCET NSDC Official Confirmation</p>
      </div>

      <div style="background-color: #161626; border: 1px solid #059669; padding: 25px; border-radius: 12px;">
        <h2 style="color: #ffffff; font-size: 20px; margin-top: 0;">Congratulations ${escapeHtml(name)}!</h2>
        <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6;">
          Your squad <strong style="color: #38bdf8;">${escapeHtml(squadName)}</strong> has been <strong style="color: #34d399;">OFFICIALLY APPROVED</strong> for <strong style="color: #c084fc;">${escapeHtml(eventTitle)}</strong>!
        </p>
        <div style="background-color: #064e3b; border: 1px solid #10b981; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="color: #a7f3d0; font-weight: bold; margin: 0; font-size: 16px;">Status: APPROVED & CONFIRMED ✓</p>
        </div>
        <div style="background-color: #0f291e; border: 1px solid #22c55e; padding: 18px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="color: #86efac; font-weight: bold; margin: 0 0 10px 0; font-size: 15px;">Join the Official WhatsApp Group:</p>
          <a href="https://chat.whatsapp.com/BaTrgCU0sm2E6XQC7p72r2?s=cl&p=a&mlu=4" target="_blank" style="display: inline-block; background-color: #25d366; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; font-size: 14px;">Join WhatsApp Group</a>
          <p style="color: #94a3b8; font-size: 12px; margin: 10px 0 0 0; word-break: break-all;">
            <a href="https://chat.whatsapp.com/BaTrgCU0sm2E6XQC7p72r2?s=cl&p=a&mlu=4" target="_blank" style="color: #38bdf8; text-decoration: underline;">https://chat.whatsapp.com/BaTrgCU0sm2E6XQC7p72r2?s=cl&p=a&mlu=4</a>
          </p>
        </div>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          Get ready with your team. Further event instructions, schedules, and details will be shared soon. We look forward to seeing you at the event!
        </p>
      </div>

      <div style="text-align: center; margin-top: 25px; color: #64748b; font-size: 12px;">
        <p>© ${new Date().getFullYear()} VCET NSDC. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `🎉 Registration Approved for ${eventTitle}!`,
    html,
  });
}

/**
 * Send notification when admin rejects event registration
 */
export async function sendRegistrationRejectedEmail({
  email,
  name,
  squadName,
  eventTitle,
  reason,
}: {
  email: string;
  name: string;
  squadName: string;
  eventTitle: string;
  reason?: string | undefined;
}) {
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #0d0d18; color: #ffffff; padding: 30px; borderRadius: 16px; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #ef4444; font-size: 26px; margin: 0;">Registration Status Update</h1>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">VCET NSDC Official Notice</p>
      </div>

      <div style="background-color: #161626; border: 1px solid #dc2626; padding: 25px; border-radius: 12px;">
        <h2 style="color: #ffffff; font-size: 20px; margin-top: 0;">Hello ${escapeHtml(name)},</h2>
        <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6;">
          Regrettably, your registration for squad <strong style="color: #38bdf8;">${escapeHtml(squadName)}</strong> for <strong style="color: #c084fc;">${escapeHtml(eventTitle)}</strong> could not be approved at this time.
        </p>
        ${
          reason
            ? `<div style="background-color: #450a0a; border: 1px solid #ef4444; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #f87171; font-weight: bold; margin: 0 0 5px 0; font-size: 14px;">Reason / Admin Note:</p>
                <p style="color: #fca5a5; margin: 0; font-size: 14px; line-height: 1.5;">${escapeHtml(reason)}</p>
               </div>`
            : ''
        }
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          If you believe this is an error or have questions regarding your submission, please reach out to the VCET NSDC organizing team.
        </p>
      </div>

      <div style="text-align: center; margin-top: 25px; color: #64748b; font-size: 12px;">
        <p>© ${new Date().getFullYear()} VCET NSDC. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Registration Update for ${eventTitle}`,
    html,
  });
}
