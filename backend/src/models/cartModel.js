import { getClient, query } from '../config/pool.js'

function normalizeCart(row) {
  return {
    id: row.id,
    productId: row.product_id,
    name: row.name,
    slug: row.slug,
    pricePaise: Number(row.price_paise),
    stockQuantity: row.stock_quantity,
    quantity: row.quantity,
    imageUrl: row.image_url || '',
    imageAlt: row.image_alt || row.name,
    lineTotalPaise: Number(row.price_paise) * row.quantity,
  }
}

export async function getOrCreateCart(userId) {
  const existing = await query('SELECT id FROM carts WHERE user_id = $1 LIMIT 1', [userId])
  if (existing.rows[0]) return existing.rows[0].id
  const created = await query(
    'INSERT INTO carts (user_id) VALUES ($1) ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW() RETURNING id',
    [userId],
  )
  return created.rows[0].id
}

export async function listCart(userId) {
  const result = await query(
    `
      SELECT c.id, ci.product_id, p.name, p.slug, p.price_paise, p.stock_quantity,
             ci.quantity, pi.image_url, pi.alt_text AS image_alt
      FROM carts c
      JOIN cart_items ci ON ci.cart_id = c.id
      JOIN products p ON p.id = ci.product_id
      LEFT JOIN LATERAL (
        SELECT image_url, alt_text FROM product_images
        WHERE product_id = p.id ORDER BY sort_order, id LIMIT 1
      ) pi ON TRUE
      WHERE c.user_id = $1 AND p.is_active = TRUE
      ORDER BY ci.id
    `,
    [userId],
  )
  return result.rows.map(normalizeCart)
}

export async function addCartItem({ userId, productId, quantity }) {
  const client = await getClient()
  try {
    await client.query('BEGIN')
    const product = await client.query(
      'SELECT id, name, stock_quantity, is_active FROM products WHERE id = $1 FOR UPDATE',
      [productId],
    )
    if (!product.rows[0]) { await client.query('ROLLBACK'); return { kind: 'not_found' } }
    if (!product.rows[0].is_active) { await client.query('ROLLBACK'); return { kind: 'inactive' } }
    if (product.rows[0].stock_quantity < quantity) { await client.query('ROLLBACK'); return { kind: 'stock', available: product.rows[0].stock_quantity } }

    const cartId = await getOrCreateCart(userId)
    const current = await client.query(
      'SELECT quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2 FOR UPDATE',
      [cartId, productId],
    )
    const nextQuantity = (current.rows[0]?.quantity || 0) + quantity
    if (nextQuantity > product.rows[0].stock_quantity) {
      await client.query('ROLLBACK')
      return { kind: 'stock', available: product.rows[0].stock_quantity, current: current.rows[0]?.quantity || 0 }
    }

    await client.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (cart_id, product_id)
       DO UPDATE SET quantity = EXCLUDED.quantity`,
      [cartId, productId, nextQuantity],
    )
    await client.query('UPDATE carts SET updated_at = NOW() WHERE id = $1', [cartId])
    await client.query('COMMIT')
    return { kind: 'updated', items: await listCart(userId) }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function updateCartItem({ userId, productId, quantity }) {
  if (quantity < 1) return removeCartItem({ userId, productId })
  const client = await getClient()
  try {
    await client.query('BEGIN')
    const product = await client.query('SELECT stock_quantity, is_active FROM products WHERE id = $1 FOR UPDATE', [productId])
    if (!product.rows[0] || !product.rows[0].is_active) { await client.query('ROLLBACK'); return { kind: 'not_found' } }
    if (quantity > product.rows[0].stock_quantity) { await client.query('ROLLBACK'); return { kind: 'stock', available: product.rows[0].stock_quantity } }

    const cart = await client.query('SELECT id FROM carts WHERE user_id = $1 FOR UPDATE', [userId])
    if (!cart.rows[0]) { await client.query('ROLLBACK'); return { kind: 'not_found' } }
    const updated = await client.query(
      'UPDATE cart_items SET quantity = $1 WHERE cart_id = $2 AND product_id = $3 RETURNING id',
      [quantity, cart.rows[0].id, productId],
    )
    if (!updated.rows[0]) { await client.query('ROLLBACK'); return { kind: 'not_found' } }
    await client.query('UPDATE carts SET updated_at = NOW() WHERE id = $1', [cart.rows[0].id])
    await client.query('COMMIT')
    return { kind: 'updated', items: await listCart(userId) }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally { client.release() }
}

export async function removeCartItem({ userId, productId }) {
  const cart = await query('SELECT id FROM carts WHERE user_id = $1 LIMIT 1', [userId])
  if (!cart.rows[0]) return { kind: 'updated', items: [] }
  await query('DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2', [cart.rows[0].id, productId])
  await query('UPDATE carts SET updated_at = NOW() WHERE id = $1', [cart.rows[0].id])
  return { kind: 'updated', items: await listCart(userId) }
}

export async function clearCart(userId) {
  const cart = await query('SELECT id FROM carts WHERE user_id = $1 LIMIT 1', [userId])
  if (cart.rows[0]) await query('DELETE FROM cart_items WHERE cart_id = $1', [cart.rows[0].id])
}
