import { Router } from 'express'
import { createSupportRequest } from '../models/supportRequestModel.js'

const router = Router()

router.post('/', async (req, res) => {
  try {
    const { name, email, reference, topic, message } = req.body

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ message: 'Name, email and message are required.' })
    }

    if (name.trim().length > 120) {
      return res.status(400).json({ message: 'Name is too long.' })
    }

    if (email.trim().length > 255) {
      return res.status(400).json({ message: 'Email address is too long.' })
    }

    if (message.trim().length < 10) {
      return res.status(400).json({ message: 'Please provide a little more detail in your message.' })
    }

    const allowedTopics = ['Order', 'Appointment', 'Product', 'Payment', 'Account', 'Other']
    const safeTopic = allowedTopics.includes(topic) ? topic : 'Other'
    const result = await createSupportRequest({
      userId: req.auth?.userId || req.auth?.sub || null,
      name: name.trim(),
      email: email.trim(),
      reference: reference?.trim() || null,
      topic: safeTopic,
      message: message.trim(),
    })

    return res.status(201).json({
      message: 'Your support request has been received.',
      request: result,
    })
  } catch (error) {
    console.error('Support request error:', error)
    return res.status(500).json({ message: 'Unable to send your support request right now.' })
  }
})

export default router
