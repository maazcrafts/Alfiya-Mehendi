import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js'
import {
  createSupportRequest,
  listUserSupportRequests,
  listSupportRequests,
  updateSupportRequestStatus,
} from '../models/supportRequestModel.js'

const router = Router()

router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, email, reference, topic, message } = req.body
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ message: 'Name, email and message are required.' })
    }
    if (message.trim().length < 10) {
      return res.status(400).json({ message: 'Please provide a little more detail in your message.' })
    }

    const allowedTopics = ['Order', 'Appointment', 'Product', 'Payment', 'Account', 'Other']
    const safeTopic = allowedTopics.includes(topic) ? topic : 'Other'
    const result = await createSupportRequest({
      userId: req.auth.userId || req.auth.sub,
      name: name.trim(),
      email: email.trim(),
      reference: reference?.trim() || null,
      topic: safeTopic,
      message: message.trim(),
    })

    return res.status(201).json({ message: 'Your support request has been received.', request: result })
  } catch (error) {
    console.error('Support request error:', error)
    return res.status(500).json({ message: 'Unable to send your support request right now.' })
  }
})

router.get('/mine', requireAuth, async (req, res) => {
  try {
    const requests = await listUserSupportRequests(req.auth.userId || req.auth.sub)
    return res.json({ requests })
  } catch (error) {
    console.error('Support history error:', error)
    return res.status(500).json({ message: 'Unable to load your support requests.' })
  }
})

router.get('/admin', requireAuth, requireAdmin, async (req, res) => {
  try {
    const allowed = ['all', 'new', 'in_progress', 'resolved']
    const status = allowed.includes(req.query.status) ? req.query.status : 'all'
    const requests = await listSupportRequests(status)
    return res.json({ requests })
  } catch (error) {
    console.error('Admin support error:', error)
    return res.status(500).json({ message: 'Unable to load support requests.' })
  }
})

router.patch('/admin/:id/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const allowed = ['new', 'in_progress', 'resolved']
    if (!allowed.includes(req.body.status)) {
      return res.status(400).json({ message: 'Invalid support status.' })
    }
    const request = await updateSupportRequestStatus(req.params.id, req.body.status)
    if (!request) return res.status(404).json({ message: 'Support request not found.' })
    return res.json({ message: 'Support request updated.', request })
  } catch (error) {
    console.error('Support status update error:', error)
    return res.status(500).json({ message: 'Unable to update support request.' })
  }
})

export default router
