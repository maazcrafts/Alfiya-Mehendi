import { query } from '../config/pool.js'

function serialize(row) {
  return {
    id: row.id,
    label: row.label || '',
    fullName: row.full_name,
    phone: row.phone,
    addressLine1: row.address_line_1,
    addressLine2: row.address_line_2 || '',
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    country: row.country,
    isDefault: row.is_default,
  }
}

export async function listUserAddresses(userId) {
  const result = await query(
    `SELECT id, label, full_name, phone, address_line_1, address_line_2, city, state, postal_code, country, is_default
     FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
    [userId],
  )
  return result.rows.map(serialize)
}

export async function createUserAddress({ userId, label, fullName, phone, addressLine1, addressLine2, city, state, postalCode, country = 'India', isDefault = false }) {
  const client = await (await import('../config/pool.js')).getClient()
  try {
    await client.query('BEGIN')
    if (isDefault) {
      await client.query('UPDATE addresses SET is_default = FALSE WHERE user_id = $1', [userId])
    }
    const result = await client.query(
      `INSERT INTO addresses
       (user_id, label, full_name, phone, address_line_1, address_line_2, city, state, postal_code, country, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id, label, full_name, phone, address_line_1, address_line_2, city, state, postal_code, country, is_default`,
      [userId, label || null, fullName, phone, addressLine1, addressLine2 || null, city, state, postalCode, country, isDefault],
    )
    await client.query('COMMIT')
    return serialize(result.rows[0])
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function findUserAddress(userId, addressId) {
  const result = await query(
    `SELECT id, label, full_name, phone, address_line_1, address_line_2, city, state, postal_code, country, is_default
     FROM addresses WHERE id = $1 AND user_id = $2 LIMIT 1`,
    [addressId, userId],
  )
  return result.rows[0] ? serialize(result.rows[0]) : null
}
