import nodemailer from 'nodemailer'

const smtpHost = () => process.env.SMTP_HOST?.trim()
const smtpPort = () => Number(process.env.SMTP_PORT || 465)
const smtpSecure = () => {
  const value = String(process.env.SMTP_SECURE || 'true').toLowerCase()
  return value === 'true' || value === '1'
}

export function isPasswordResetEmailConfigured() {
  return Boolean(
    smtpHost() &&
    process.env.SMTP_USER?.trim() &&
    process.env.SMTP_PASS?.trim() &&
    process.env.MAIL_FROM?.trim(),
  )
}

function createTransporter() {
  if (!isPasswordResetEmailConfigured()) {
    const error = new Error('Password reset email delivery is not configured.')
    error.code = 'SMTP_NOT_CONFIGURED'
    throw error
  }

  return nodemailer.createTransport({
    host: smtpHost(),
    port: smtpPort(),
    secure: smtpSecure(),
    auth: {
      user: process.env.SMTP_USER.trim(),
      pass: process.env.SMTP_PASS.trim(),
    },
  })
}

export async function sendPasswordResetOtp({ to, otp, expiryMinutes }) {
  const transporter = createTransporter()
  const from = process.env.MAIL_FROM.trim()

  await transporter.sendMail({
    from,
    to,
    subject: `Alfiya Mehendi password reset code: ${otp}`,
    text: [
      'Alfiya Mehendi',
      '',
      `Your password reset verification code is: ${otp}`,
      '',
      `This code expires in ${expiryMinutes} minutes.`,
      'If you did not request a password reset, you can ignore this email.',
    ].join('\n'),
    html: `
      <div style="margin:0;padding:32px 16px;background:#f6f1e8;font-family:Arial,sans-serif;color:#2f261f">
        <div style="max-width:520px;margin:0 auto;background:#fffdf9;border:1px solid #ded2c6;border-radius:18px;padding:32px">
          <div style="font-family:Georgia,serif;font-size:28px;color:#3d3028">Alfiya</div>
          <div style="margin-top:2px;font-size:10px;letter-spacing:3px;color:#6f7f60">MEHENDI</div>
          <h1 style="margin:28px 0 10px;font-family:Georgia,serif;font-size:30px;font-weight:500;color:#211d19">Password reset code</h1>
          <p style="margin:0;color:#6e6157;line-height:1.6">Use the verification code below to reset your Alfiya Mehendi password.</p>
          <div style="margin:28px 0;padding:18px;text-align:center;border-radius:12px;background:#f1ede4;border:1px solid #e1d7ca">
            <div style="font-size:34px;letter-spacing:10px;font-weight:700;color:#394633">${otp}</div>
          </div>
          <p style="margin:0;color:#6e6157;line-height:1.6">This code expires in <strong>${expiryMinutes} minutes</strong>.</p>
          <p style="margin:24px 0 0;color:#8a7d72;font-size:12px;line-height:1.6">If you did not request a password reset, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  })
}
