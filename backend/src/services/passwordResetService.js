import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'
import { query } from '../config/pool.js'

const OTP_LENGTH = 6
const OTP_EXPIRY_MINUTES = Math.max(5, Number(process.env.PASSWORD_RESET_OTP_EXPIRY_MINUTES || 10))
const OTP_MAX_ATTEMPTS = Math.max(1, Number(process.env.PASSWORD_RESET_OTP_MAX_ATTEMPTS || 5))
const OTP_RESEND_COOLDOWN_SECONDS = Math.max(30, Number(process.env.PASSWORD_RESET_OTP_RESEND_COOLDOWN_SECONDS || 60))

function hash(value) {
  return createHash('sha256').update(value).digest('hex')
}

function safeCompareHex(leftHex, rightHex) {
  const left = Buffer.from(leftHex, 'hex')
  const right = Buffer.from(rightHex, 'hex')
  return left.length === right.length && timingSafeEqual(left, right)
}

export function getPasswordResetOtpConfig() {
  return {
    expiryMinutes: OTP_EXPIRY_MINUTES,
    maxAttempts: OTP_MAX_ATTEMPTS,
    resendCooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
  }
}

export async function createPasswordResetOtp(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  if (!normalizedEmail) return null

  const userResult = await query(
    'SELECT id, email FROM users WHERE email = $1 AND password_hash IS NOT NULL LIMIT 1',
    [normalizedEmail],
  )
  const user = userResult.rows[0]
  if (!user) return null

  const recentResult = await query(
    "SELECT created_at FROM password_reset_tokens WHERE user_id = $1 AND used_at IS NULL AND created_at > NOW() - ($2::text || ' seconds')::interval ORDER BY created_at DESC LIMIT 1",
    [user.id, OTP_RESEND_COOLDOWN_SECONDS],
  )

  if (recentResult.rows[0]) {
    const retryAfterSeconds = Math.max(
      1,
      OTP_RESEND_COOLDOWN_SECONDS - Math.floor((Date.now() - new Date(recentResult.rows[0].created_at).getTime()) / 1000),
    )
    return { throttled: true, retryAfterSeconds, email: user.email }
  }

  await query(
    'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
    [user.id],
  )

  const otp = String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0')
  const placeholderTokenHash = hash(randomBytes(32).toString('hex'))
  const otpHash = hash(otp)

  await query(
    "INSERT INTO password_reset_tokens (user_id, token_hash, otp_hash, otp_attempts, verified_at, expires_at) VALUES ($1, $2, $3, 0, NULL, NOW() + ($4::text || ' minutes')::interval)",
    [user.id, placeholderTokenHash, otpHash, OTP_EXPIRY_MINUTES],
  )

  return {
    email: user.email,
    otp,
    expiryMinutes: OTP_EXPIRY_MINUTES,
  }
}

export async function verifyPasswordResetOtp(email, otp) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const normalizedOtp = String(otp || '').replace(/\D/g, '')

  if (!normalizedEmail || normalizedOtp.length !== OTP_LENGTH) return { kind: 'invalid' }

  const result = await query(
    "SELECT prt.id, prt.otp_hash, prt.otp_attempts, prt.expires_at FROM password_reset_tokens prt JOIN users u ON u.id = prt.user_id WHERE u.email = $1 AND prt.used_at IS NULL AND prt.expires_at > NOW() ORDER BY prt.created_at DESC LIMIT 1",
    [normalizedEmail],
  )

  const row = result.rows[0]
  if (!row) return { kind: 'invalid' }

  if (Number(row.otp_attempts) >= OTP_MAX_ATTEMPTS) return { kind: 'locked' }

  const incomingHash = hash(normalizedOtp)
  if (!row.otp_hash || !safeCompareHex(incomingHash, row.otp_hash)) {
    const attempts = Number(row.otp_attempts) + 1
    await query(
      'UPDATE password_reset_tokens SET otp_attempts = $1 WHERE id = $2 AND used_at IS NULL',
      [attempts, row.id],
    )

    if (attempts >= OTP_MAX_ATTEMPTS) return { kind: 'locked' }
    return { kind: 'invalid', attemptsRemaining: OTP_MAX_ATTEMPTS - attempts }
  }

  const resetToken = randomBytes(32).toString('hex')
  await query(
    'UPDATE password_reset_tokens SET token_hash = $1, verified_at = NOW() WHERE id = $2 AND used_at IS NULL AND expires_at > NOW()',
    [hash(resetToken), row.id],
  )

  return {
    kind: 'verified',
    resetToken,
    expiresInMinutes: Math.max(1, Math.ceil((new Date(row.expires_at).getTime() - Date.now()) / 60000)),
  }
}

export async function resetPasswordWithVerifiedToken(resetToken, passwordHash) {
  const tokenHash = hash(String(resetToken || ''))

  const result = await query(
    "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = (SELECT user_id FROM password_reset_tokens WHERE token_hash = $2 AND verified_at IS NOT NULL AND used_at IS NULL AND expires_at > NOW() LIMIT 1) RETURNING id",
    [passwordHash, tokenHash],
  )

  if (!result.rows[0]) return false

  await query(
    'UPDATE password_reset_tokens SET used_at = NOW(), otp_hash = NULL WHERE token_hash = $1',
    [tokenHash],
  )

  return true
}
