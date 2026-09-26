import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function formatPrice(paise) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100)
}

export default function ProductDetails() {
  const { slug } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadProduct() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(`${apiBase}/api/products/${encodeURIComponent(slug)}`, {
          signal: controller.signal,
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Product not found.')
        setProduct(data.product)
      } catch (requestError) {
        if (requestError.name !== 'AbortError') setError(requestError.message || 'Unable to load the product.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadProduct()
    return () => controller.abort()
  }, [slug])

  if (loading) return <main className="product-details-page"><div className="catalog-state">Loading product…</div></main>
  if (error) return <main className="product-details-page"><div className="catalog-state catalog-error">{error}</div></main>
  if (!product) return null

  const image = product.images?.[0]?.image_url

  return (
    <main className="product-details-page">
      <div className="product-details-inner">
        <Link to="/products" className="product-back">← Back to shop</Link>
        <section className="product-details-grid">
          <div className="product-details-media">
            {image ? (
              <img src={image} alt={product.images?.[0]?.alt_text || product.name} />
            ) : (
              <div className="product-details-placeholder">Alfiya Mehendi</div>
            )}
          </div>
          <div className="product-details-copy">
            <p className="catalog-eyebrow">{product.categoryName}</p>
            <h1>{product.name}</h1>
            <strong className="product-price">{formatPrice(product.pricePaise)}</strong>
            {product.description && <p className="product-description">{product.description}</p>}
            <p className={product.stockQuantity > 0 ? 'stock-note available' : 'stock-note'}>
              {product.stockQuantity > 0 ? `${product.stockQuantity} available` : 'Currently out of stock'}
            </p>
            <button type="button" className="product-primary-action" disabled={product.stockQuantity === 0}>
              Add to Cart
            </button>
            <p className="product-next-note">Cart functionality will be connected in the next commerce step.</p>
          </div>
        </section>
      </div>
    </main>
  )
}
