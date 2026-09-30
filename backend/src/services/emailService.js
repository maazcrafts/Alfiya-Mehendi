import https from 'node:https'

const brevoApiKey = () => process.env.BREVO_API_KEY?.trim()
const senderEmail = () => process.env.BREVO_SENDER_EMAIL?.trim()
const senderName = () => process.env.BREVO_SENDER_NAME?.trim() || 'Alfiya Mehendi'

export function isPasswordResetEmailConfigured() {
  return Boolean(brevoApiKey() && senderEmail())
}

function sendBrevoEmail(payload) {
  return new Promise((resolve, reject) => {
    const apiKey = brevoApiKey()

    const body = JSON.stringify(payload)
    const request = https.request(
      {
        hostname: 'api.brevo.com',
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'api-key': apiKey,
          'content-length': Buffer.byteLength(body),
        },
        timeout: 15000,
      },
      (response) => {
        let data = ''

        response.on('data', (chunk) => {
          data += chunk
        })

        response.on('end', () => {
          let parsed = {}
          try {
            parsed = data ? JSON.parse(data) : {}
          } catch {
            parsed = { raw: data }
          }

          if (response.statusCode >= 200 && response.statusCode < 300) {
            return resolve(parsed)
          }

          const error = new Error(
            `Brevo API error: ${response.statusCode} ${parsed.message || data || 'Unknown error'}`,
          )
          error.statusCode = response.statusCode
          error.response = parsed
          reject(error)
        })
      },
    )

    request.on('timeout', () => {
      request.destroy(new Error('Brevo API request timed out'))
    })

    request.on('error', reject)
    request.write(body)
    request.end()
  })
}

export async function sendPasswordResetOtp({ to, otp, expiryMinutes }) {
  if (!isPasswordResetEmailConfigured()) {
    const error = new Error('Brevo password reset email delivery is not configured.')
    error.code = 'BREVO_NOT_CONFIGURED'
    throw error
  }

  const subject = 'Alfiya Mehendi password reset code'

  const text = [
    'Alfiya Mehendi',
    '',
    'We received a request to reset your Alfiya Mehendi password.',
    '',
    `Your 6-digit verification code is: ${otp}`,
    '',
    `This code expires in ${expiryMinutes} minutes.`,
    '',
    'If you did not request a password reset, you can safely ignore this email.',
  ].join('\\n')

  const digitCells = String(otp).split('').map((digit) => `
    <td width="44" height="56" align="center" valign="middle"
      style="background:#f1ede4;border:1px solid #ddd3c8;border-radius:8px;font-family:Arial,sans-serif;font-size:28px;font-weight:700;color:#394633;">
      ${digit}
    </td>
    <td width="8" style="font-size:0;line-height:0;">&nbsp;</td>
  `).join('')

  const html = `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Alfiya Mehendi password reset code</title>
</head>
<body style="margin:0;padding:0;background:#f6f1e8;-webkit-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f6f1e8;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#fffdf9;border:1px solid #ded2c6;border-radius:18px;">
          <tr>
            <td style="padding:36px 28px;">
              <div style="font-family:Georgia,serif;font-size:30px;color:#3d3028;">Alfiya</div>
              <div style="margin-top:2px;font-family:Arial,sans-serif;font-size:10px;letter-spacing:3px;color:#6f7f60;">MEHENDI</div>

              <h1 style="margin:28px 0 10px;font-family:Georgia,serif;font-size:30px;font-weight:500;color:#211d19;">
                Password reset code
              </h1>

              <p style="margin:0;font-family:Arial,sans-serif;font-size:15px;line-height:24px;color:#6e6157;">
                We received a request to reset your Alfiya Mehendi password. Enter the verification code below to continue.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;background:#faf7f1;border:1px solid #e1d7ca;border-radius:14px;">
                <tr>
                  <td align="center" style="padding:24px 16px;">
                    <div style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;color:#8a7d72;margin-bottom:16px;">
                      VERIFICATION CODE
                    </div>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        ${digitCells}
                      </tr>
                    </table>
                    <div style="margin-top:16px;font-family:Arial,sans-serif;font-size:13px;color:#6e6157;">
                      This code expires in <strong>${expiryMinutes} minutes</strong>.
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-family:Arial,sans-serif;font-size:12px;line-height:19px;color:#8a7d72;">
                If you did not request a password reset, you can safely ignore this email.
              </p>

              <div style="height:1px;background:#e1d7ca;margin:28px 0 20px;"></div>

              <p style="margin:0;text-align:center;font-family:Arial,sans-serif;font-size:12px;color:#9a8e84;">
                This is an automated message from Alfiya Mehendi.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  const result = await sendBrevoEmail({
    sender: {
      name: senderName(),
      email: senderEmail(),
    },
    to: [{ email: to }],
    subject,
    textContent: text,
    htmlContent: html,
  })

  console.log('[Brevo] Password reset email accepted', {
    to,
    messageId: result?.messageId || null,
  })

  return result
}
