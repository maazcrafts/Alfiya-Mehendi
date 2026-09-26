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
