import express from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { createUserAddress, listUserAddresses } from '../models/addressModel.js'

const router = express.Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  try {
    const addresses = await listUserAddresses(req.auth.userId || req.auth.sub)
    return res.json({ addresses })
  } catch (error) {
    console.error('Load addresses error:', error)
    return res.status(500).json({ message: 'Unable to load your addresses.' })
  }
})

router.post('/', async (req, res) => {
  try {
    const body = req.body || {}
    const fields = {
      label: String(body.label || '').trim(),
      fullName: String(body.fullName || '').trim(),
      phone: String(body.phone || '').trim(),
      addressLine1: String(body.addressLine1 || '').trim(),
      addressLine2: String(body.addressLine2 || '').trim(),
      city: String(body.city || '').trim(),
      state: String(body.state || '').trim(),
      postalCode: String(body.postalCode || '').trim(),
      country: String(body.country || 'India').trim() || 'India',
      isDefault: Boolean(body.isDefault),
    }

    if (!fields.fullName || !fields.phone || !fields.addressLine1 || !fields.city || !fields.state || !fields.postalCode) {
      return res.status(400).json({ message: 'Please complete all required delivery details.' })
    }
    if (fields.fullName.length > 120 || fields.phone.length > 30 || fields.addressLine1.length > 500 || fields.city.length > 100 || fields.state.length > 100 || fields.postalCode.length > 20) {
      return res.status(400).json({ message: 'One or more address fields are too long.' })
    }

    const address = await createUserAddress({
      userId: req.auth.userId || req.auth.sub,
      ...fields,
    })
    return res.status(201).json({ address })
  } catch (error) {
    console.error('Create address error:', error)
    return res.status(500).json({ message: 'Unable to save this delivery address.' })
  }
})

export default router
