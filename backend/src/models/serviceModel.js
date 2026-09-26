import { query } from '../config/pool.js'

export async function listActiveServices() {
  const result = await query(
    `
      SELECT id, name, slug, level, description, price_paise, duration_minutes
      FROM services
      WHERE is_active = TRUE
      ORDER BY
        CASE level
          WHEN 'basic' THEN 1
          WHEN 'intermediate' THEN 2
          WHEN 'advanced' THEN 3
          WHEN 'bridal' THEN 4
          ELSE 5
        END,
        price_paise ASC,
        created_at ASC
    `,
  )
  return result.rows
}

export async function findServiceBySlug(slug) {
  const result = await query(
    `
      SELECT id, name, slug, level, description, price_paise, duration_minutes
      FROM services
      WHERE slug = $1 AND is_active = TRUE
      LIMIT 1
    `,
    [slug],
  )
  return result.rows[0] || null
}
