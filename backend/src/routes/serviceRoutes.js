import { Router } from 'express'
import { findServiceBySlug, listActiveServices } from '../models/serviceModel.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const services = await listActiveServices()
    res.json({ services })
  } catch (error) {
    console.error('Failed to load services:', error)
    res.status(500).json({ message: 'Unable to load services.' })
  }
})

router.get('/:slug', async (req, res) => {
  try {
    const service = await findServiceBySlug(req.params.slug)
    if (!service) return res.status(404).json({ message: 'Service not found.' })
    res.json({ service })
  } catch (error) {
    console.error('Failed to load service:', error)
    res.status(500).json({ message: 'Unable to load service.' })
  }
})

export default router
