import { createHash, randomBytes } from 'node:crypto'
import { query } from '../config/pool.js'

export async function createPasswordResetToken(email) {
  const userResult = await query(
    'SELECT id, email FROM users WHERE email = LOWER($1) AND password_hash IS NOT NULL LIMIT 1',
    [email],
  )
  const user = userResult.rows[0]
  if (!user) return null

  await query(
    'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
    [user.id],
  )

  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(rawToken).digest('hex')

  await query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '30 minutes')`,
    [user.id, tokenHash],
  )

  return { token: rawToken, email: user.email }
}

export async function resetPasswordWithToken(token, passwordHash) {
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const result = await query(
    `UPDATE users
     SET password_hash = $1, updated_at = NOW()
     WHERE id = (
       SELECT user_id FROM password_reset_tokens
       WHERE token_hash = $2
         AND used_at IS NULL
         AND expires_at > NOW()
       LIMIT 1
     )
     RETURNING id`,
    [passwordHash, tokenHash],
  )

  if (!result.rows[0]) return false

  await query(
    'UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = $1',
    [tokenHash],
  )
  return true
}
