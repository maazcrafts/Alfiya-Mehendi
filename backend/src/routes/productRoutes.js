import { Router } from 'express'
import {
  createProduct,
  findProductById,
  findProductBySlug,
  listProducts,
  setProductActive,
  updateProduct,
} from '../models/productModel.js'
import { requireAdmin, requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

function parseNonNegativeInteger(value, field) {
  const number = Number(value)
  if (!Number.isInteger(number) || number < 0) {
    throw new Error(`${field} must be a non-negative integer.`)
  }
  return number
}

function validateProductInput(body, { partial = false } = {}) {
  const errors = []

  if (!partial || body.name !== undefined) {
    if (!body.name?.trim() || body.name.trim().length > 160) {
      errors.push('Name is required and must be 160 characters or fewer.')
    }
  }

  if (!partial || body.slug !== undefined) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug || '')) {
      errors.push('Slug must contain lowercase letters, numbers and hyphens only.')
    }
  }

  if (!partial || body.pricePaise !== undefined) {
    try { parseNonNegativeInteger(body.pricePaise, 'pricePaise') } catch (error) { errors.push(error.message) }
  }

  if (body.stockQuantity !== undefined) {
    try { parseNonNegativeInteger(body.stockQuantity, 'stockQuantity') } catch (error) { errors.push(error.message) }
  }

  if (body.categoryId !== undefined && body.categoryId !== null && typeof body.categoryId !== 'string') {
    errors.push('categoryId must be a UUID string or null.')
  }

  if (body.images !== undefined && !Array.isArray(body.images)) {
    errors.push('images must be an array.')
  }

  return errors
}

router.get('/', async (req, res) => {
  try {
    const products = await listProducts({
      categorySlug: req.query.category,
      search: req.query.search,
    })
    return res.json({ products })
  } catch (error) {
    console.error('List products error:', error)
    return res.status(500).json({ message: 'Unable to load products.' })
  }
})

router.get('/:slug', async (req, res) => {
  try {
    const product = await findProductBySlug(req.params.slug)
    if (!product) return res.status(404).json({ message: 'Product not found.' })
    return res.json({ product })
  } catch (error) {
    console.error('Get product error:', error)
    return res.status(500).json({ message: 'Unable to load the product.' })
  }
})

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const errors = validateProductInput(req.body)
    if (errors.length) return res.status(400).json({ message: errors[0], errors })

    const product = await createProduct({
      categoryId: req.body.categoryId,
      name: req.body.name.trim(),
      slug: req.body.slug.trim(),
      description: req.body.description?.trim() || null,
      pricePaise: parseNonNegativeInteger(req.body.pricePaise, 'pricePaise'),
      stockQuantity: req.body.stockQuantity === undefined ? 0 : parseNonNegativeInteger(req.body.stockQuantity, 'stockQuantity'),
      isActive: req.body.isActive !== false,
      images: req.body.images,
    })

    return res.status(201).json({ product })
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'A product with this slug already exists.' })
    }
    console.error('Create product error:', error)
    return res.status(500).json({ message: 'Unable to create the product.' })
  }
})

router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const errors = validateProductInput(req.body, { partial: true })
    if (errors.length) return res.status(400).json({ message: errors[0], errors })

    const existing = await findProductById(req.params.id, { includeInactive: true })
    if (!existing) return res.status(404).json({ message: 'Product not found.' })

    const product = await updateProduct(req.params.id, {
      categoryId: req.body.categoryId,
      name: req.body.name?.trim(),
      slug: req.body.slug?.trim(),
      description: req.body.description === undefined ? undefined : req.body.description?.trim() || null,
      pricePaise: req.body.pricePaise === undefined ? undefined : parseNonNegativeInteger(req.body.pricePaise, 'pricePaise'),
      stockQuantity: req.body.stockQuantity === undefined ? undefined : parseNonNegativeInteger(req.body.stockQuantity, 'stockQuantity'),
      isActive: req.body.isActive,
      images: req.body.images,
    })

    return res.json({ product })
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'A product with this slug already exists.' })
    }
    console.error('Update product error:', error)
    return res.status(500).json({ message: 'Unable to update the product.' })
  }
})

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const product = await setProductActive(req.params.id, false)
    if (!product) return res.status(404).json({ message: 'Product not found.' })
    return res.json({ product, message: 'Product deactivated.' })
  } catch (error) {
    console.error('Deactivate product error:', error)
    return res.status(500).json({ message: 'Unable to deactivate the product.' })
  }
})

export default router
