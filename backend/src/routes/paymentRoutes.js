import { Router } from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { createPendingOrderFromCart, finalizePaidOrder } from '../models/orderModel.js'
import { createPendingPayment, findPaymentForOrder, markPaymentFailed, markPaymentPaid } from '../models/paymentModel.js'
import { createRazorpayOrder, fetchRazorpayPayment, getRazorpayKeyId, verifyRazorpaySignature } from '../services/razorpayService.js'

const router = Router()

router.get('/config', requireAuth, async (_req, res) => {
  try {
    return res.json({ provider: 'razorpay', keyId: getRazorpayKeyId() })
  } catch (error) {
    return res.status(503).json({ message: 'Payment gateway is not configured yet.' })
  }
})

router.post('/create-order', requireAuth, async (req, res) => {
  try {
    const addressId = String(req.body?.addressId || '').trim()
    if (!addressId) return res.status(400).json({ message: 'A delivery address is required.' })

    const pending = await createPendingOrderFromCart({
      userId: req.auth.userId || req.auth.sub,
      addressId,
    })

    if (pending.kind === 'address') return res.status(400).json({ message: 'Please select a valid delivery address.' })
    if (pending.kind === 'empty') return res.status(400).json({ message: 'Your cart is empty.' })
    if (pending.kind === 'stock') {
      return res.status(409).json({
        message: pending.available > 0
          ? `${pending.productName} only has ${pending.available} item(s) available, but your cart requests ${pending.requested}.`
          : `${pending.productName} is currently out of stock.`,
      })
    }

    const razorpayOrder = await createRazorpayOrder({
      amountPaise: pending.order.totalPaise,
      receipt: 'ALF-' + pending.order.id.replaceAll('-', '').slice(0, 20),
    })

    const payment = await createPendingPayment({
      orderId: pending.order.id,
      provider: 'razorpay',
      providerOrderId: razorpayOrder.id,
      amountPaise: pending.order.totalPaise,
    })

    return res.status(201).json({
      order: pending.order,
      payment: {
        id: payment.id,
        provider: payment.provider,
        providerOrderId: payment.provider_order_id,
        amountPaise: Number(payment.amount_paise),
      },
      razorpay: {
        keyId: getRazorpayKeyId(),
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
    })
  } catch (error) {
    console.error('Create payment order error:', error)
    return res.status(error.status === 400 ? 400 : 500).json({ message: error.message || 'Unable to start payment.' })
  }
})

router.post('/verify', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId || req.auth.sub
    const orderId = String(req.body?.orderId || '').trim()
    const razorpayOrderId = String(req.body?.razorpayOrderId || '').trim()
    const razorpayPaymentId = String(req.body?.razorpayPaymentId || '').trim()
    const razorpaySignature = String(req.body?.razorpaySignature || '').trim()

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ message: 'Payment verification details are incomplete.' })
    }

    const payment = await findPaymentForOrder({ orderId, userId })
    if (!payment) return res.status(404).json({ message: 'Payment record not found.' })

    if (payment.provider_order_id !== razorpayOrderId) {
      return res.status(400).json({ message: 'Payment order verification failed.' })
    }

    if (!verifyRazorpaySignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    })) {
      await markPaymentFailed({ paymentId: payment.id, providerPaymentId: razorpayPaymentId })
      return res.status(400).json({ message: 'Payment signature verification failed.' })
    }

    const providerPayment = await fetchRazorpayPayment(razorpayPaymentId)
    if (providerPayment.order_id !== razorpayOrderId || providerPayment.status !== 'captured') {
      await markPaymentFailed({ paymentId: payment.id, providerPaymentId: razorpayPaymentId })
      return res.status(400).json({ message: 'Payment was not captured successfully.' })
    }

    if (Number(providerPayment.amount) !== Number(payment.amount_paise)) {
      await markPaymentFailed({ paymentId: payment.id, providerPaymentId: razorpayPaymentId })
      return res.status(400).json({ message: 'Payment amount verification failed.' })
    }

    await markPaymentPaid({ paymentId: payment.id, providerPaymentId: razorpayPaymentId })
    const finalized = await finalizePaidOrder({ userId, orderId })

    if (finalized.kind === 'stock') {
      return res.status(409).json({ message: `${finalized.productName} is no longer available in the requested quantity. Please contact support for payment assistance.` })
    }

    if (finalized.kind === 'not_found') {
      return res.status(404).json({ message: 'Order not found.' })
    }

    return res.json({ order: finalized.order, payment: { status: 'paid', providerPaymentId: razorpayPaymentId } })
  } catch (error) {
    console.error('Verify payment error:', error)
    return res.status(500).json({ message: 'Unable to verify the payment right now.' })
  }
})

export default router
