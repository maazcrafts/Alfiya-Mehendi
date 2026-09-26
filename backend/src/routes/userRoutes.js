import express from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { findUserById, updateUserName } from '../models/userModel.js'

const router = express.Router()

function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    picture: user.avatar_url || '',
    role: user.role,
    provider: user.google_id ? 'google' : 'password',
    hasPassword: Boolean(user.password_hash),
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  }
}

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await findUserById(req.auth.userId || req.auth.sub)
    if (!user) return res.status(404).json({ message: 'Account not found.' })
    return res.json({ user: serializeUser(user) })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return res.status(500).json({ message: 'Unable to load your profile right now.' })
  }
})

router.patch('/me', requireAuth, async (req, res) => {
  try {
    const name = req.body?.name?.trim()

    if (!name || name.length < 2) {
      return res.status(400).json({ message: 'Please enter your full name.' })
    }

    if (name.length > 120) {
      return res.status(400).json({ message: 'Your name is too long.' })
    }

    const user = await updateUserName({
      userId: req.auth.userId || req.auth.sub,
      name,
    })

    if (!user) return res.status(404).json({ message: 'Account not found.' })
    return res.json({ user: serializeUser(user) })
  } catch (error) {
    console.error('Profile update error:', error)
    return res.status(500).json({ message: 'Unable to update your profile right now.' })
  }
})

export default router
