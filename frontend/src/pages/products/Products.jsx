import { Link, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const categories = [
  { label: 'All Products', value: '' },
  { label: 'Mehendi Powder', value: 'mehendi-powder' },
  { label: 'Oils', value: 'oils' },
  { label: 'Tools', value: 'tools' },
  { label: 'Cone & Cellophane Supplies', value: 'cone-cellophane-supplies' },
]

function formatPrice(paise) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100)
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const category = searchParams.get('category') || ''
  const search = searchParams.get('search') || ''

  useEffect(() => {
    const controller = new AbortController()

    async function loadProducts() {
      setLoading(true)
      setError('')

      try {
        const params = new URLSearchParams()
        if (category) params.set('category', category)
        if (search) params.set('search', search)

        const query = params.toString()
        const response = await fetch(`${apiBase}/api/products${query ? `?${query}` : ''}`, {
          signal: controller.signal,
        })
        const data = await response.json()

        if (!response.ok) throw new Error(data.message || 'Unable to load products.')
        setProducts(data.products || [])
      } catch (requestError) {
        if (requestError.name !== 'AbortError') setError(requestError.message || 'Unable to load products.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadProducts()
    return () => controller.abort()
  }, [category, search])

  const heading = useMemo(() => {
    if (search) return `Search results for “${search}”`
    return categories.find((item) => item.value === category)?.label || 'All Products'
  }, [category, search])

  const chooseCategory = (value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set('category', value)
    else next.delete('category')
    setSearchParams(next)
  }

  return (
    <main className="catalog-page">
      <section className="catalog-hero">
        <p className="catalog-eyebrow">Alfiya Mehendi Shop</p>
        <h1>Mehendi, tools & essentials.</h1>
        <p>Explore the products currently available from Alfiya Mehendi.</p>
      </section>

      <section className="catalog-content">
        <div className="catalog-toolbar">
          <div className="category-tabs" aria-label="Product categories">
            {categories.map((item) => (
              <button
                key={item.value || 'all'}
                type="button"
                className={category === item.value ? 'category-tab active' : 'category-tab'}
                onClick={() => chooseCategory(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {loading && <div className="catalog-state">Loading products…</div>}
        {!loading && error && <div className="catalog-state catalog-error">{error}</div>}
        {!loading && !error && products.length === 0 && (
          <div className="catalog-empty">
            <span className="catalog-empty-mark">❧</span>
            <h2>No products listed yet</h2>
            <p>The catalogue is connected. Products will appear here as soon as they are added.</p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="product-grid">
            {products.map((product) => {
              const image = product.images?.[0]?.image_url
              return (
                <Link key={product.id} to={`/products/${product.slug}`} className="product-card">
                  <div className="product-card-media">
                    {image ? (
                      <img src={image} alt={product.images?.[0]?.alt_text || product.name} />
                    ) : (
                      <div className="product-card-placeholder" aria-hidden="true">Alfiya</div>
                    )}
                  </div>
                  <div className="product-card-body">
                    <p>{product.categoryName}</p>
                    <h2>{product.name}</h2>
                    <strong>{formatPrice(product.pricePaise)}</strong>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
