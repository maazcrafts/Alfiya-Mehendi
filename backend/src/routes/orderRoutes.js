import { Router } from 'express'
import { requireAdmin, requireAuth } from '../middleware/authMiddleware.js'
import { listAdminOrders, listUserOrders } from '../models/orderModel.js'

const router = Router()

router.get('/mine', requireAuth, async (req, res) => {
  try {
    const orders = await listUserOrders(req.auth.userId || req.auth.sub)
    return res.json({ orders })
  } catch (error) {
    console.error('Load user orders error:', error)
    return res.status(500).json({ message: 'Unable to load your orders.' })
  }
})

export default router


router.get('/admin', requireAuth, requireAdmin, async (req, res) => {
  try {
    const allowed = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
    const status = allowed.includes(req.query.status) ? req.query.status : 'all'
    const orders = await listAdminOrders(status)
    return res.json({ orders })
  } catch (error) {
    console.error('Load admin orders error:', error)
    return res.status(500).json({ message: 'Unable to load customer orders.' })
  }
})
