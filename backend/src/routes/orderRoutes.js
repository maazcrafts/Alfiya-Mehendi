import { Router } from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { listUserOrders } from '../models/orderModel.js'

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
