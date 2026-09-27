import { Router } from 'express'
import { requireAdmin, requireAuth } from '../middleware/authMiddleware.js'
import { query } from '../config/pool.js'

const router = Router()

router.use(requireAuth, requireAdmin)

router.get('/overview', async (_req, res) => {
  try {
    const [orders, bookings, support, products, customers, revenue, recentOrders, categories] = await Promise.all([
      query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'pending')::int AS pending FROM orders`),
      query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'requested')::int AS pending FROM bookings`),
      query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status IN ('new','in_progress'))::int AS open FROM support_requests`),
      query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE is_active = TRUE)::int AS active, COALESCE(SUM(stock_quantity),0)::int AS stock FROM products`),
      query(`SELECT COUNT(*)::int AS total FROM users WHERE role = 'customer'`),
      query(`SELECT COALESCE(SUM(total_paise),0)::bigint AS revenue FROM orders WHERE status NOT IN ('cancelled','refunded')`),
      query(`
        SELECT o.id, o.status, o.total_paise, o.created_at, u.name AS customer_name, u.email AS customer_email
        FROM orders o JOIN users u ON u.id = o.user_id
        ORDER BY o.created_at DESC LIMIT 6
      `),
      query(`SELECT id, name, slug FROM categories ORDER BY name ASC`),
    ])

    return res.json({
      stats: {
        orders: orders.rows[0],
        bookings: bookings.rows[0],
        support: support.rows[0],
        products: products.rows[0],
        customers: customers.rows[0],
        revenuePaise: Number(revenue.rows[0].revenue),
      },
      recentOrders: recentOrders.rows,
      categories: categories.rows,
    })
  } catch (error) {
    console.error('Admin overview error:', error)
    return res.status(500).json({ message: 'Unable to load admin overview.' })
  }
})

router.get('/customers', async (_req, res) => {
  try {
    const result = await query(`
      SELECT
        u.id, u.name, u.email, u.avatar_url, u.role, u.created_at,
        COUNT(DISTINCT o.id)::int AS order_count,
        COUNT(DISTINCT b.id)::int AS booking_count,
        COALESCE(SUM(o.total_paise) FILTER (WHERE o.status NOT IN ('cancelled','refunded')),0)::bigint AS lifetime_value_paise
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      LEFT JOIN bookings b ON b.user_id = u.id
      WHERE u.role = 'customer'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `)
    return res.json({ customers: result.rows })
  } catch (error) {
    console.error('Admin customers error:', error)
    return res.status(500).json({ message: 'Unable to load customers.' })
  }
})

export default router
