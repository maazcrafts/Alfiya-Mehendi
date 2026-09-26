import { query } from '../config/pool.js'

export async function createSupportRequest({ userId = null, name, email, reference = null, topic, message }) {
  const result = await query(
    `INSERT INTO support_requests (user_id, name, email, reference, topic, message)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, status, created_at`,
    [userId, name, email, reference || null, topic, message],
  )
  return result.rows[0]
}
