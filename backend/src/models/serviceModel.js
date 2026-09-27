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


export async function listAllServices() {
  const result = await query(`
    SELECT id, name, slug, level, description, price_paise, duration_minutes, is_active, created_at, updated_at
    FROM services
    ORDER BY created_at DESC
  `)
  return result.rows
}

export async function createService({ name, slug, level, description, pricePaise, durationMinutes, isActive = true }) {
  const result = await query(`
    INSERT INTO services (name, slug, level, description, price_paise, duration_minutes, is_active)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING id, name, slug, level, description, price_paise, duration_minutes, is_active, created_at, updated_at
  `, [name, slug, level, description || null, pricePaise, durationMinutes || null, isActive])
  return result.rows[0]
}

export async function updateService(id, fields) {
  const allowed = {
    name: 'name',
    slug: 'slug',
    level: 'level',
    description: 'description',
    pricePaise: 'price_paise',
    durationMinutes: 'duration_minutes',
    isActive: 'is_active',
  }
  const sets = []
  const values = []
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || !allowed[key]) continue
    values.push(key === 'description' ? (value || null) : value)
    sets.push(`${allowed[key]} = $${values.length}`)
  }
  if (!sets.length) return null
  values.push(id)
  const result = await query(`
    UPDATE services SET ${sets.join(', ')}, updated_at = NOW()
    WHERE id = $${values.length}
    RETURNING id, name, slug, level, description, price_paise, duration_minutes, is_active, created_at, updated_at
  `, values)
  return result.rows[0] || null
}
