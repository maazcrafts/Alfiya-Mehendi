import { Router } from 'express'
import { requireAdmin, requireAuth } from '../middleware/authMiddleware.js'
import { createOrderFromCart, listAdminOrders, listUserOrders, updateOrderStatus } from '../models/orderModel.js'

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

router.post('/', requireAuth, async (req, res) => {
  try {
    const addressId = String(req.body?.addressId || '').trim()
    if (!addressId) return res.status(400).json({ message: 'A delivery address is required.' })

    const result = await createOrderFromCart({
      userId: req.auth.userId || req.auth.sub,
      addressId,
    })

    if (result.kind === 'address') return res.status(400).json({ message: 'Please select a valid delivery address.' })
    if (result.kind === 'empty') return res.status(400).json({ message: 'Your cart is empty.' })
    if (result.kind === 'stock') {
      return res.status(409).json({
        message: result.available > 0
          ? `${result.productName} only has ${result.available} item(s) available, but your cart requests ${result.requested}.`
          : `${result.productName} is currently out of stock.`,
      })
    }

    return res.status(201).json({ order: result.order })
  } catch (error) {
    console.error('Create order error:', error)
    return res.status(500).json({ message: 'Unable to place your order right now.' })
  }
})

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

// Keep a single default export for the router.
router.patch('/admin/:id/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const allowed = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
    if (!allowed.includes(req.body.status)) {
      return res.status(400).json({ message: 'Invalid order status.' })
    }
    const order = await updateOrderStatus(req.params.id, req.body.status)
    if (!order) return res.status(404).json({ message: 'Order not found.' })
    return res.json({ message: 'Order status updated.', order })
  } catch (error) {
    console.error('Update order status error:', error)
    return res.status(500).json({ message: 'Unable to update the order.' })
  }
})

export default router
