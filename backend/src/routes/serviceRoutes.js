import { Router } from 'express'
import { requireAdmin, requireAuth } from '../middleware/authMiddleware.js'
import {
  findServiceBySlug,
  listActiveServices,
  listAllServices,
  createService,
  updateService,
} from '../models/serviceModel.js'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const services = await listActiveServices()
    res.json({ services })
  } catch (error) {
    console.error('Failed to load services:', error)
    res.status(500).json({ message: 'Unable to load services.' })
  }
})

router.get('/admin/all', requireAuth, requireAdmin, async (_req, res) => {
  try {
    res.json({ services: await listAllServices() })
  } catch (error) {
    console.error('Failed to load all services:', error)
    res.status(500).json({ message: 'Unable to load services.' })
  }
})

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, slug, level, description, pricePaise, durationMinutes, isActive } = req.body
    if (!name?.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug || '')) {
      return res.status(400).json({ message: 'Name and a valid lowercase slug are required.' })
    }
    if (!['basic','intermediate','advanced','bridal'].includes(level)) {
      return res.status(400).json({ message: 'Invalid service level.' })
    }
    const price = Number(pricePaise)
    if (!Number.isInteger(price) || price < 0) return res.status(400).json({ message: 'Price must be a non-negative integer in paise.' })
    const service = await createService({
      name: name.trim(), slug: slug.trim(), level, description: description?.trim(),
      pricePaise: price, durationMinutes: durationMinutes === '' ? null : Number(durationMinutes), isActive: isActive !== false,
    })
    return res.status(201).json({ service })
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'A service with this slug already exists.' })
    console.error('Create service error:', error)
    return res.status(500).json({ message: 'Unable to create the service.' })
  }
})

router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const fields = {}
    for (const key of ['name','slug','level','description','pricePaise','durationMinutes','isActive']) {
      if (req.body[key] !== undefined) fields[key] = req.body[key]
    }
    if (fields.level !== undefined && !['basic','intermediate','advanced','bridal'].includes(fields.level)) {
      return res.status(400).json({ message: 'Invalid service level.' })
    }
    if (fields.pricePaise !== undefined && (!Number.isInteger(Number(fields.pricePaise)) || Number(fields.pricePaise) < 0)) {
      return res.status(400).json({ message: 'Price must be a non-negative integer in paise.' })
    }
    if (fields.name !== undefined) fields.name = String(fields.name).trim()
    if (fields.slug !== undefined) fields.slug = String(fields.slug).trim()
    const service = await updateService(req.params.id, fields)
    if (!service) return res.status(404).json({ message: 'Service not found.' })
    return res.json({ service })
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'A service with this slug already exists.' })
    console.error('Update service error:', error)
    return res.status(500).json({ message: 'Unable to update the service.' })
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
