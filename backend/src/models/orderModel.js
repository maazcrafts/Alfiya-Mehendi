import { query } from '../config/pool.js'

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
