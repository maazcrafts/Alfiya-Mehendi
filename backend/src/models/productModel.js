import { query } from '../config/pool.js'

const productSelect = `
  SELECT
    p.id,
    p.category_id,
    p.name,
    p.slug,
    p.description,
    p.price_paise,
    p.stock_quantity,
    p.is_active,
    p.created_at,
    p.updated_at,
    c.name AS category_name,
    c.slug AS category_slug,
    COALESCE(
      json_agg(
        json_build_object(
          'id', pi.id,
          'image_url', pi.image_url,
          'alt_text', pi.alt_text,
          'sort_order', pi.sort_order
        )
        ORDER BY pi.sort_order, pi.id
      ) FILTER (WHERE pi.id IS NOT NULL),
      '[]'::json
    ) AS images
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN product_images pi ON pi.product_id = p.id
`

function normalizeProduct(row) {
  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: row.category_name,
    categorySlug: row.category_slug,
    name: row.name,
    slug: row.slug,
    description: row.description,
    pricePaise: Number(row.price_paise),
    stockQuantity: row.stock_quantity,
    isActive: row.is_active,
    images: row.images || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listProducts({ categorySlug, search, includeInactive = false } = {}) {
  const conditions = []
  const params = []

  if (!includeInactive) conditions.push('p.is_active = TRUE')

  if (categorySlug) {
    params.push(categorySlug)
    conditions.push(`c.slug = $${params.length}`)
  }

  if (search?.trim()) {
    params.push(`%${search.trim()}%`)
    conditions.push(`(p.name ILIKE $${params.length} OR COALESCE(p.description, '') ILIKE $${params.length})`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const result = await query(
    `${productSelect}
     ${where}
     GROUP BY p.id, c.id
     ORDER BY p.created_at DESC, p.name ASC`,
    params,
  )

  return result.rows.map(normalizeProduct)
}

export async function findProductBySlug(slug, { includeInactive = false } = {}) {
  const conditions = ['p.slug = $1']
  if (!includeInactive) conditions.push('p.is_active = TRUE')

  const result = await query(
    `${productSelect}
     WHERE ${conditions.join(' AND ')}
     GROUP BY p.id, c.id
     LIMIT 1`,
    [slug],
  )

  return result.rows[0] ? normalizeProduct(result.rows[0]) : null
}

export async function createProduct({
  categoryId,
  name,
  slug,
  description,
  pricePaise,
  stockQuantity = 0,
  isActive = true,
  images = [],
}) {
  const client = await (await import('../config/pool.js')).pool.connect()

  try {
    await client.query('BEGIN')

    const productResult = await client.query(
      `
        INSERT INTO products (
          category_id, name, slug, description, price_paise,
          stock_quantity, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `,
      [categoryId || null, name, slug, description || null, pricePaise, stockQuantity, isActive],
    )

    const productId = productResult.rows[0].id

    if (Array.isArray(images)) {
      for (const [index, image] of images.entries()) {
        if (!image?.imageUrl) continue
        await client.query(
          `
            INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
            VALUES ($1, $2, $3, $4)
          `,
          [productId, image.imageUrl, image.altText || null, Number.isInteger(image.sortOrder) ? image.sortOrder : index],
        )
      }
    }

    await client.query('COMMIT')
    return findProductById(productId, { includeInactive: true })
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function findProductById(id, { includeInactive = false } = {}) {
  const conditions = ['p.id = $1']
  if (!includeInactive) conditions.push('p.is_active = TRUE')

  const result = await query(
    `${productSelect}
     WHERE ${conditions.join(' AND ')}
     GROUP BY p.id, c.id
     LIMIT 1`,
    [id],
  )

  return result.rows[0] ? normalizeProduct(result.rows[0]) : null
}

export async function updateProduct(id, {
  categoryId,
  name,
  slug,
  description,
  pricePaise,
  stockQuantity,
  isActive,
  images,
}) {
  const client = await (await import('../config/pool.js')).pool.connect()

  try {
    await client.query('BEGIN')

    const fields = []
    const values = []
    const add = (column, value) => {
      values.push(value)
      fields.push(`${column} = $${values.length}`)
    }

    if (categoryId !== undefined) add('category_id', categoryId || null)
    if (name !== undefined) add('name', name)
    if (slug !== undefined) add('slug', slug)
    if (description !== undefined) add('description', description || null)
    if (pricePaise !== undefined) add('price_paise', pricePaise)
    if (stockQuantity !== undefined) add('stock_quantity', stockQuantity)
    if (isActive !== undefined) add('is_active', isActive)

    if (fields.length) {
      values.push(id)
      await client.query(
        `UPDATE products SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length}`,
        values,
      )
    }

    if (Array.isArray(images)) {
      await client.query('DELETE FROM product_images WHERE product_id = $1', [id])

      for (const [index, image] of images.entries()) {
        if (!image?.imageUrl) continue
        await client.query(
          `
            INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
            VALUES ($1, $2, $3, $4)
          `,
          [id, image.imageUrl, image.altText || null, Number.isInteger(image.sortOrder) ? image.sortOrder : index],
        )
      }
    }

    await client.query('COMMIT')
    return findProductById(id, { includeInactive: true })
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function setProductActive(id, isActive) {
  const result = await query(
    'UPDATE products SET is_active = $2, updated_at = NOW() WHERE id = $1 RETURNING id',
    [id, isActive],
  )

  if (!result.rowCount) return null
  return findProductById(id, { includeInactive: true })
}
