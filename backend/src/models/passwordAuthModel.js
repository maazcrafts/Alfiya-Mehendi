import { query } from '../config/pool.js'

export async function createPasswordUser({ name, email, passwordHash }) {
  const result = await query(
    `
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, LOWER($2), $3)
      RETURNING id, name, email, avatar_url, role, created_at, updated_at
    `,
    [name, email, passwordHash],
  )

  return result.rows[0]
}

export async function findUserByEmail(email) {
  const result = await query(
    `
      SELECT id, name, email, password_hash, avatar_url, role, created_at, updated_at
      FROM users
      WHERE email = LOWER($1)
      LIMIT 1
    `,
    [email],
  )

  return result.rows[0] || null
}
