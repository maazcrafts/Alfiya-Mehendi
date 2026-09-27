import { getClient, query } from '../config/pool.js'
import { findUserAddress } from './addressModel.js'

export async function createOrderFromCart({ userId, addressId }) {
  const client = await getClient()
  try {
    await client.query('BEGIN')

    const address = await client.query(
      'SELECT id FROM addresses WHERE id = $1 AND user_id = $2 LIMIT 1',
      [addressId, userId],
    )
    if (!address.rows[0]) {
      await client.query('ROLLBACK')
      return { kind: 'address' }
    }

    const cart = await client.query('SELECT id FROM carts WHERE user_id = $1 LIMIT 1 FOR UPDATE', [userId])
    if (!cart.rows[0]) {
      await client.query('ROLLBACK')
      return { kind: 'empty' }
    }

    const cartItems = await client.query(
      `SELECT ci.product_id, ci.quantity, p.name, p.price_paise, p.stock_quantity, p.is_active
       FROM cart_items ci JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = $1 ORDER BY ci.id FOR UPDATE OF p`,
      [cart.rows[0].id],
    )
    if (!cartItems.rows.length) {
      await client.query('ROLLBACK')
      return { kind: 'empty' }
    }

    const unavailable = cartItems.rows.find(item => !item.is_active || item.stock_quantity < item.quantity)
    if (unavailable) {
      await client.query('ROLLBACK')
      return {
        kind: 'stock',
        productName: unavailable.name,
        available: unavailable.stock_quantity,
        requested: unavailable.quantity,
      }
    }

    const subtotal = cartItems.rows.reduce((sum, item) => sum + Number(item.price_paise) * item.quantity, 0)
    const shipping = 0
    const total = subtotal + shipping

    const order = await client.query(
      `INSERT INTO orders (user_id, shipping_address_id, status, subtotal_paise, shipping_paise, total_paise)
       VALUES ($1, $2, 'pending', $3, $4, $5) RETURNING id, status, subtotal_paise, shipping_paise, total_paise, created_at`,
      [userId, addressId, subtotal, shipping, total],
    )

    for (const item of cartItems.rows) {
      const lineTotal = Number(item.price_paise) * item.quantity
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price_paise, quantity, line_total_paise)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [order.rows[0].id, item.product_id, item.name, item.price_paise, item.quantity, lineTotal],
      )
      await client.query(
        'UPDATE products SET stock_quantity = stock_quantity - $1, updated_at = NOW() WHERE id = $2',
        [item.quantity, item.product_id],
      )
    }

    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.rows[0].id])
    await client.query('UPDATE carts SET updated_at = NOW() WHERE id = $1', [cart.rows[0].id])
    await client.query('COMMIT')

    const created = order.rows[0]
    return {
      kind: 'created',
      order: {
        id: created.id,
        status: created.status,
        subtotalPaise: Number(created.subtotal_paise),
        shippingPaise: Number(created.shipping_paise),
        totalPaise: Number(created.total_paise),
        createdAt: created.created_at,
        address: await findUserAddress(userId, addressId),
      },
    }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}



export async function listUserOrders(userId) {
  const result = await query(
    `
      SELECT
        o.id,
        o.status,
        o.subtotal_paise,
        o.shipping_paise,
        o.total_paise,
        o.created_at,
        o.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'productName', oi.product_name,
              'unitPricePaise', oi.unit_price_paise,
              'quantity', oi.quantity,
              'lineTotalPaise', oi.line_total_paise
            )
            ORDER BY oi.product_name
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `,
    [userId],
  )

  return result.rows
}


export async function listAdminOrders(status = 'all') {
  const params = []
  const where = status === 'all' ? '' : 'WHERE o.status = $1'
  if (status !== 'all') params.push(status)

  const result = await query(
    `
      SELECT
        o.id, o.status, o.subtotal_paise, o.shipping_paise, o.total_paise,
        o.created_at, o.updated_at,
        u.id AS user_id, u.name AS customer_name, u.email AS customer_email,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'productName', oi.product_name,
              'unitPricePaise', oi.unit_price_paise,
              'quantity', oi.quantity,
              'lineTotalPaise', oi.line_total_paise
            )
            ORDER BY oi.product_name
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM orders o
      JOIN users u ON u.id = o.user_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      ${where}
      GROUP BY o.id, u.id
      ORDER BY o.created_at DESC
    `,
    params,
  )

  return result.rows
}


export async function createPendingOrderFromCart({ userId, addressId }) {
  const client = await getClient()
  try {
    await client.query('BEGIN')
    const address = await client.query('SELECT id FROM addresses WHERE id = $1 AND user_id = $2 LIMIT 1',[addressId,userId])
    if (!address.rows[0]) { await client.query('ROLLBACK'); return { kind: 'address' } }
    const cart = await client.query('SELECT id FROM carts WHERE user_id = $1 LIMIT 1 FOR UPDATE',[userId])
    if (!cart.rows[0]) { await client.query('ROLLBACK'); return { kind: 'empty' } }
    const cartItems = await client.query(`SELECT ci.product_id, ci.quantity, p.name, p.price_paise, p.stock_quantity, p.is_active
      FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.cart_id = $1 ORDER BY ci.id`,[cart.rows[0].id])
    if (!cartItems.rows.length) { await client.query('ROLLBACK'); return { kind: 'empty' } }
    const unavailable = cartItems.rows.find(item => !item.is_active || item.stock_quantity < item.quantity)
    if (unavailable) {
      await client.query('ROLLBACK')
      return { kind:'stock', productName:unavailable.name, available:unavailable.stock_quantity, requested:unavailable.quantity }
    }
    const subtotal = cartItems.rows.reduce((sum,item)=>sum+Number(item.price_paise)*item.quantity,0)
    const order = await client.query(
      `INSERT INTO orders (user_id,shipping_address_id,status,subtotal_paise,shipping_paise,total_paise)
       VALUES ($1,$2,'pending',$3,0,$3) RETURNING id,status,subtotal_paise,shipping_paise,total_paise,created_at`,
      [userId,addressId,subtotal])
    for (const item of cartItems.rows) {
      const lineTotal=Number(item.price_paise)*item.quantity
      await client.query(`INSERT INTO order_items (order_id,product_id,product_name,unit_price_paise,quantity,line_total_paise)
        VALUES ($1,$2,$3,$4,$5,$6)`,[order.rows[0].id,item.product_id,item.name,item.price_paise,item.quantity,lineTotal])
    }
    await client.query('COMMIT')
    const created=order.rows[0]
    return { kind:'created', order:{id:created.id,status:created.status,subtotalPaise:Number(created.subtotal_paise),shippingPaise:Number(created.shipping_paise),totalPaise:Number(created.total_paise),createdAt:created.created_at,address:await findUserAddress(userId,addressId)} }
  } catch(error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
}

export async function finalizePaidOrder({ userId, orderId }) {
  const client=await getClient()
  try {
    await client.query('BEGIN')
    const orderResult=await client.query('SELECT id,user_id,status,shipping_address_id,subtotal_paise,shipping_paise,total_paise FROM orders WHERE id=$1 AND user_id=$2 LIMIT 1 FOR UPDATE',[orderId,userId])
    const order=orderResult.rows[0]
    if(!order){await client.query('ROLLBACK');return {kind:'not_found'}}
    if(order.status!=='pending'){await client.query('ROLLBACK');return {kind:'already_finalized',order:{id:order.id,status:order.status}}}
    const items=await client.query(`SELECT oi.product_id,oi.product_name,oi.quantity,p.stock_quantity,p.is_active
      FROM order_items oi LEFT JOIN products p ON p.id=oi.product_id WHERE oi.order_id=$1 ORDER BY oi.id FOR UPDATE OF p`,[order.id])
    const unavailable=items.rows.find(item=>!item.product_id||!item.is_active||item.stock_quantity<item.quantity)
    if(unavailable){await client.query('ROLLBACK');return {kind:'stock',productName:unavailable.product_name,available:unavailable.stock_quantity||0,requested:unavailable.quantity}}
    for(const item of items.rows) await client.query('UPDATE products SET stock_quantity=stock_quantity-$1,updated_at=NOW() WHERE id=$2',[item.quantity,item.product_id])
    const updated=await client.query(`UPDATE orders SET status='confirmed',updated_at=NOW() WHERE id=$1 RETURNING id,status,subtotal_paise,shipping_paise,total_paise,created_at`,[order.id])
    await client.query(`DELETE FROM cart_items ci USING carts c WHERE ci.cart_id=c.id AND c.user_id=$1 AND EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id=$2 AND oi.product_id=ci.product_id)`,[userId,order.id])
    await client.query('UPDATE carts SET updated_at=NOW() WHERE user_id=$1',[userId])
    await client.query('COMMIT')
    const created=updated.rows[0]
    return {kind:'finalized',order:{id:created.id,status:created.status,subtotalPaise:Number(created.subtotal_paise),shippingPaise:Number(created.shipping_paise),totalPaise:Number(created.total_paise),createdAt:created.created_at,address:await findUserAddress(userId,order.shipping_address_id)}}
  } catch(error){await client.query('ROLLBACK');throw error} finally{client.release()}
}
