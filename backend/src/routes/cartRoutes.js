import express from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { addCartItem, clearCart, listCart, removeCartItem, updateCartItem } from '../models/cartModel.js'

const router = express.Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  try {
    const items = await listCart(req.auth.sub)
    return res.json({ items })
  } catch (error) {
    console.error('Load cart error:', error)
    return res.status(500).json({ message: 'Unable to load your cart.' })
  }
})

router.post('/items', async (req, res) => {
  try {
    const productId = String(req.body?.productId || '').trim()
    const quantity = Number(req.body?.quantity)
    if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return res.status(400).json({ message: 'A valid product and quantity are required.' })
    }
    const result = await addCartItem({ userId: req.auth.sub, productId, quantity })
    if (result.kind === 'not_found' || result.kind === 'inactive') return res.status(404).json({ message: 'That product is no longer available.' })
    if (result.kind === 'stock') return res.status(409).json({ message: `Only ${result.available} item(s) are available.` })
    return res.status(201).json({ items: result.items })
  } catch (error) {
    console.error('Add cart item error:', error)
    return res.status(500).json({ message: 'Unable to add this product to your cart.' })
  }
})

router.patch('/items/:productId', async (req, res) => {
  try {
    const quantity = Number(req.body?.quantity)
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return res.status(400).json({ message: 'Quantity must be between 1 and 99.' })
    const result = await updateCartItem({ userId: req.auth.sub, productId: req.params.productId, quantity })
    if (result.kind === 'not_found') return res.status(404).json({ message: 'Cart item not found.' })
    if (result.kind === 'stock') return res.status(409).json({ message: `Only ${result.available} item(s) are available.` })
    return res.json({ items: result.items })
  } catch (error) {
    console.error('Update cart item error:', error)
    return res.status(500).json({ message: 'Unable to update your cart.' })
  }
})

router.delete('/items/:productId', async (req, res) => {
  try {
    const result = await removeCartItem({ userId: req.auth.sub, productId: req.params.productId })
    return res.json({ items: result.items })
  } catch (error) {
    console.error('Remove cart item error:', error)
    return res.status(500).json({ message: 'Unable to remove this item.' })
  }
})

router.delete('/', async (req, res) => {
  try {
    await clearCart(req.auth.sub)
    return res.json({ items: [] })
  } catch (error) {
    console.error('Clear cart error:', error)
    return res.status(500).json({ message: 'Unable to clear your cart.' })
  }
})

export default router
