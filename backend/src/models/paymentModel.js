import { query } from '../config/pool.js'

export async function createPendingPayment({ orderId, provider, providerOrderId, amountPaise }) {
  const result = await query(
    `INSERT INTO payments (order_id, provider, provider_order_id, amount_paise, status)
     VALUES ($1,$2,$3,$4,'pending')
     RETURNING id, order_id, provider, provider_order_id, amount_paise, status, created_at`,
    [orderId, provider, providerOrderId, amountPaise],
  )
  return result.rows[0]
}

export async function findPaymentForOrder({ orderId, userId }) {
  const result = await query(
    `SELECT p.id, p.order_id, p.provider, p.provider_order_id, p.provider_payment_id,
            p.amount_paise, p.status
     FROM payments p
     JOIN orders o ON o.id = p.order_id
     WHERE p.order_id = $1 AND o.user_id = $2
     ORDER BY p.created_at DESC
     LIMIT 1`,
    [orderId, userId],
  )
  return result.rows[0] || null
}

export async function markPaymentPaid({ paymentId, providerPaymentId }) {
  const result = await query(
    `UPDATE payments
     SET provider_payment_id = $2, status = 'paid', updated_at = NOW()
     WHERE id = $1
     RETURNING id, order_id, provider, provider_order_id, provider_payment_id, amount_paise, status`,
    [paymentId, providerPaymentId],
  )
  return result.rows[0] || null
}

export async function markPaymentFailed({ paymentId, providerPaymentId = null }) {
  const result = await query(
    `UPDATE payments
     SET provider_payment_id = COALESCE($2, provider_payment_id), status = 'failed', updated_at = NOW()
     WHERE id = $1
     RETURNING id, order_id, provider, provider_order_id, provider_payment_id, amount_paise, status`,
    [paymentId, providerPaymentId],
  )
  return result.rows[0] || null
}
