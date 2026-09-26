import DashboardSidebar from '../../components/DashboardSidebar.jsx'
import { Link, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const categories = [
  { label: 'All Products', value: '', note: 'Everything in the shop' },
  { label: 'Mehendi Powder', value: 'mehendi-powder', note: 'Filtered & fine powders' },
  { label: 'Oils', value: 'oils', note: 'Aftercare & finishing oils' },
  { label: 'Tools', value: 'tools', note: 'Everyday application tools' },
  { label: 'Cone & Cellophane', value: 'cone-cellophane-supplies', note: 'Cones, sheets & supplies' },
]

function formatPrice(paise) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100)
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('alfiya_user') || '{}')
  } catch {
    return {}
  }
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user] = useState(getUser)
  const [cartCount, setCartCount] = useState(0)

  const category = searchParams.get('category') || ''
  const search = searchParams.get('search') || ''

  useEffect(() => {
    async function loadCartCount() {
      const authToken = localStorage.getItem('alfiya_auth_token') || ''
      if (!authToken) { setCartCount(0); return }
      try {
        const response = await fetch(`${apiBase}/api/cart`, { headers: { Authorization: `Bearer ${authToken}` } })
        if (!response.ok) return
        const data = await response.json()
        setCartCount((data.items || []).reduce((sum, item) => sum + item.quantity, 0))
      } catch {}
    }
    loadCartCount()
    const onCartUpdate = () => loadCartCount()
    window.addEventListener('alfiya-cart-updated', onCartUpdate)
    return () => window.removeEventListener('alfiya-cart-updated', onCartUpdate)
  }, [])

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
        if (requestError.name !== 'AbortError') {
          setError(requestError.message || 'Unable to load products.')
        }
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

  const firstName = user?.name?.split(' ')?.[0] || 'there'

  return (
    <main className="shop-dashboard">
      <DashboardSidebar active="shop" />

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <p className="dashboard-kicker">Customer dashboard</p>
            <h1>Good to see you, {firstName}.</h1>
          </div>

          <div className="dashboard-top-actions">
            <label className="dashboard-search">
              <span className="dashboard-search-mark" aria-hidden="true"></span>
              <input
                value={search}
                onChange={(event) => {
                  const next = new URLSearchParams(searchParams)
                  if (event.target.value) next.set('search', event.target.value)
                  else next.delete('search')
                  setSearchParams(next)
                }}
                placeholder="Search products..."
                aria-label="Search products"
              />
            </label>
            <Link to="/cart" className="dashboard-cart">
              <span className="dashboard-bag-mark" aria-hidden="true"></span>
              <b>{cartCount}</b>
            </Link>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="dashboard-welcome-card">
            <div>
              <p className="dashboard-kicker">Alfiya Mehendi Store</p>
              <h2>Everything you need for beautiful mehendi.</h2>
              <p>Shop powders, oils, application tools and cone supplies — all from one place.</p>
            </div>
            <div className="dashboard-welcome-art" aria-hidden="true"><span></span><i></i><b></b></div>
          </section>

          <section className="dashboard-category-section">
            <div className="dashboard-heading-row">
              <div>
                <p className="dashboard-kicker">Browse</p>
                <h2>Shop by category</h2>
              </div>
              <span>{products.length} products available</span>
            </div>

            <div className="dashboard-category-grid">
              {categories.map((item) => (
                <button
                  key={item.value || 'all'}
                  type="button"
                  className={category === item.value ? 'dashboard-category active' : 'dashboard-category'}
                  onClick={() => chooseCategory(item.value)}
                >
                  <span className="dashboard-category-rule" aria-hidden="true"></span>
                  <span>{item.label}</span>
                  <small>{item.note}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="dashboard-products-section">
            <div className="dashboard-heading-row">
              <div>
                <p className="dashboard-kicker">Catalogue</p>
                <h2>{heading}</h2>
              </div>
              {category && <button type="button" className="dashboard-clear" onClick={() => chooseCategory('')}>View all</button>}
            </div>

            {loading && <div className="catalog-state">Loading products…</div>}
            {!loading && error && <div className="catalog-state catalog-error">{error}</div>}

            {!loading && !error && products.length === 0 && (
              <div className="dashboard-empty">
                <span className="dashboard-empty-rule" aria-hidden="true"></span>
                <h3>No products listed yet</h3>
                <p>Your catalogue connection is working. Products will appear here when they are added.</p>
              </div>
            )}

            {!loading && !error && products.length > 0 && (
              <div className="dashboard-product-grid">
                {products.map((product) => {
                  const image = product.images?.[0]?.image_url
                  return (
                    <Link key={product.id} to={`/products/${product.slug}`} className="dashboard-product-card">
                      <div className="dashboard-product-media">
                        {image ? (
                          <img src={image} alt={product.images?.[0]?.alt_text || product.name} />
                        ) : (
                          <div>Alfiya</div>
                        )}
                        {product.stockQuantity === 0 && <span className="dashboard-sold-out">Out of stock</span>}
                      </div>
                      <div className="dashboard-product-body">
                        <small>{product.categoryName}</small>
                        <h3>{product.name}</h3>
                        <strong>{formatPrice(product.pricePaise)}</strong>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  )
}
