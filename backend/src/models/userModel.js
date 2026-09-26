import { query } from '../config/pool.js'

export async function upsertGoogleUser({ googleId, name, email, avatarUrl }) {
  const result = await query(
    `
      INSERT INTO users (name, email, google_id, avatar_url)
      VALUES ($1, LOWER($2), $3, $4)
      ON CONFLICT (email)
      DO UPDATE SET
        name = EXCLUDED.name,
        google_id = COALESCE(users.google_id, EXCLUDED.google_id),
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW()
      RETURNING id, name, email, avatar_url, role, created_at, updated_at
    `,
    [name || 'Alfiya Customer', email, googleId, avatarUrl || null],
  )

  return result.rows[0]
}


export async function findUserById(userId) {
  const result = await query(
    `
      SELECT id, name, email, avatar_url, role, google_id, password_hash, created_at, updated_at
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [userId],
  )

  return result.rows[0] || null
}

export async function updateUserName({ userId, name }) {
  const result = await query(
    `
      UPDATE users
      SET name = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, name, email, avatar_url, role, google_id, password_hash, created_at, updated_at
    `,
    [name, userId],
  )

  return result.rows[0] || null
}
