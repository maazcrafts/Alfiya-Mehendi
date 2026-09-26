import { query } from '../config/pool.js'

export async function createSupportRequest({ userId, name, email, reference = null, topic, message }) {
  const result = await query(
    `INSERT INTO support_requests (user_id, name, email, reference, topic, message)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, status, created_at`,
    [userId, name, email, reference || null, topic, message],
  )
  return result.rows[0]
}

export async function listUserSupportRequests(userId) {
  const result = await query(
    `SELECT id, name, email, reference, topic, message, status, created_at, updated_at
     FROM support_requests
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId],
  )
  return result.rows
}

export async function listSupportRequests(status = 'all') {
  const values = []
  let where = ''
  if (status !== 'all') {
    values.push(status)
    where = 'WHERE sr.status = $1'
  }
  const result = await query(
    `SELECT sr.id, sr.name, sr.email, sr.reference, sr.topic, sr.message, sr.status,
            sr.created_at, sr.updated_at, u.name AS account_name, u.email AS account_email
     FROM support_requests sr
     LEFT JOIN users u ON u.id = sr.user_id
     ${where}
     ORDER BY sr.created_at DESC`,
    values,
  )
  return result.rows
}

export async function updateSupportRequestStatus(id, status) {
  const result = await query(
    `UPDATE support_requests
     SET status = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING id, status, updated_at`,
    [id, status],
  )
  return result.rows[0] || null
}
