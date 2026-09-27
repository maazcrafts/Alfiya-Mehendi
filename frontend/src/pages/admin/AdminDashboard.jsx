import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DashboardSidebar from '../../components/DashboardSidebar.jsx'

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function getUser() {
  try { return JSON.parse(localStorage.getItem('alfiya_user') || '{}') } catch { return {} }
}
function token() { return localStorage.getItem('alfiya_auth_token') || '' }
function money(paise) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((Number(paise) || 0) / 100)
}
function dateLabel(value) {
  return value ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)) : ''
}

const emptyProduct = { name: '', slug: '', description: '', pricePaise: '', stockQuantity: 0, categoryId: '', isActive: true, images: [] }
const emptyService = { name: '', slug: '', level: 'basic', description: '', pricePaise: '', durationMinutes: '', isActive: true }

export default function AdminDashboard() {
  const navigate = useNavigate()
  const admin = useMemo(getUser, [])
  const [tab, setTab] = useState('overview')
  const [overview, setOverview] = useState(null)
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [services, setServices] = useState([])
  const [productForm, setProductForm] = useState(emptyProduct)
  const [serviceForm, setServiceForm] = useState(emptyService)
  const [editingProduct, setEditingProduct] = useState(null)
  const [editingService, setEditingService] = useState(null)
  const [productSearch, setProductSearch] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [serviceSearch, setServiceSearch] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (admin?.role !== 'admin') {
      navigate('/services', { replace: true })
      return
    }
    loadOverview()
  }, [])

  async function request(path, options = {}) {
    const response = await fetch(apiBase + path, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        Authorization: `Bearer ${token()}`,
        ...(options.headers || {}),
      },
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.message || 'Request failed.')
    return data
  }

  async function loadOverview() {
    setLoading(true); setError('')
    try {
      const data = await request('/api/admin/overview')
      setOverview(data)
    } catch (e) {
      setError(e.message)
    } finally { setLoading(false) }
  }

  async function loadCustomers() {
    try {
      const data = await request('/api/admin/customers')
      setCustomers(data.customers || [])
    } catch (e) { setError(e.message) }
  }

  async function loadProducts() {
    try {
      const data = await request('/api/products/admin/all')
      setProducts(data.products || [])
    } catch (e) { setError(e.message) }
  }

  async function loadServices() {
    try {
      const data = await request('/api/services/admin/all')
      setServices(data.services || [])
    } catch (e) { setError(e.message) }
  }

  useEffect(() => {
    if (tab === 'customers') loadCustomers()
    if (tab === 'products') loadProducts()
    if (tab === 'services') loadServices()
  }, [tab])

  function flash(message) {
    setNotice(message)
    setTimeout(() => setNotice(''), 2500)
  }

  async function saveProduct(event) {
    event.preventDefault(); setSaving(true); setError('')
    try {
      const payload = { ...productForm, pricePaise: Math.round(Number(productForm.pricePaise) * 100), stockQuantity: Number(productForm.stockQuantity) }
      const data = await request(editingProduct ? `/api/products/${editingProduct}` : '/api/products', {
        method: editingProduct ? 'PATCH' : 'POST', body: JSON.stringify(payload),
      })
      setProductForm(emptyProduct); setEditingProduct(null); setImageUrl('')
      await loadProducts()
      flash(editingProduct ? 'Product updated.' : 'Product created.')
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function deactivateProduct(id) {
    if (!window.confirm('Deactivate this product?')) return
    try { await request(`/api/products/${id}`, { method: 'DELETE' }); await loadProducts(); flash('Product deactivated.') }
    catch (e) { setError(e.message) }
  }

  function editProduct(product) {
    setEditingProduct(product.id)
    setProductForm({
      name: product.name, slug: product.slug, description: product.description || '',
      pricePaise: (Number(product.pricePaise) / 100).toFixed(2), stockQuantity: product.stockQuantity,
      categoryId: product.categoryId || '', isActive: product.isActive,
      images: (product.images || []).map(i => ({ imageUrl: i.image_url, altText: i.alt_text || '' })),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function addImage() {
    if (!imageUrl.trim()) return
    setProductForm(current => ({ ...current, images: [...current.images, { imageUrl: imageUrl.trim(), altText: productForm.name }] }))
    setImageUrl('')
  }

  async function saveService(event) {
    event.preventDefault(); setSaving(true); setError('')
    try {
      const payload = { ...serviceForm, pricePaise: Math.round(Number(serviceForm.pricePaise) * 100), durationMinutes: serviceForm.durationMinutes === '' ? null : Number(serviceForm.durationMinutes) }
      await request(editingService ? `/api/services/${editingService}` : '/api/services', {
        method: editingService ? 'PATCH' : 'POST', body: JSON.stringify(payload),
      })
      setServiceForm(emptyService); setEditingService(null); await loadServices()
      flash(editingService ? 'Service updated.' : 'Service created.')
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function toggleService(service) {
    try {
      await request(`/api/services/${service.id}`, { method: 'PATCH', body: JSON.stringify({ isActive: !service.is_active }) })
      await loadServices(); flash(service.is_active ? 'Service hidden.' : 'Service restored.')
    } catch (e) { setError(e.message) }
  }

  const filteredProducts = products.filter(p => !productSearch || `${p.name} ${p.slug}`.toLowerCase().includes(productSearch.toLowerCase()))
  const filteredCustomers = customers.filter(c => !customerSearch || `${c.name} ${c.email}`.toLowerCase().includes(customerSearch.toLowerCase()))
  const filteredServices = services.filter(s => !serviceSearch || `${s.name} ${s.slug}`.toLowerCase().includes(serviceSearch.toLowerCase()))

  if (admin?.role !== 'admin') return null

  return (
    <main className="shop-dashboard admin-dashboard">
      <DashboardSidebar active="admin-dashboard" adminOnly />
      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <p className="dashboard-kicker">Private admin workspace</p>
            <h1>Alfiya control center.</h1>
            <p className="admin-subtitle">{admin.name || 'Administrator'} · {admin.email}</p>
          </div>
          <Link to="/products" className="services-shop-link">Open customer shop →</Link>
        </header>

        <div className="dashboard-content admin-content">
          <div className="admin-tabs">
            {[
              ['overview','Overview'], ['products','Products'], ['services','Services'], ['customers','Customers'],
            ].map(([value, label]) => (
              <button key={value} className={tab === value ? 'active' : ''} onClick={() => { setTab(value); setError('') }}>{label}</button>
            ))}
            <Link to="/admin/orders" className="admin-tab-link">Orders</Link>
            <Link to="/admin/bookings" className="admin-tab-link">Bookings</Link>
            <Link to="/admin/support" className="admin-tab-link">Support</Link>
          </div>

          {error && <div className="booking-alert booking-alert-error">{error}</div>}
          {notice && <div className="booking-alert booking-alert-success">{notice}</div>}

          {loading && tab === 'overview' ? <div className="services-state">Loading dashboard…</div> : null}

          {tab === 'overview' && overview && (
            <>
              <div className="admin-stat-grid">
                <div><span>Total orders</span><strong>{overview.stats.orders.total}</strong><small>{overview.stats.orders.pending} pending</small></div>
                <div><span>Appointments</span><strong>{overview.stats.bookings.total}</strong><small>{overview.stats.bookings.pending} pending</small></div>
                <div><span>Open support</span><strong>{overview.stats.support.open}</strong><small>{overview.stats.support.total} total tickets</small></div>
                <div><span>Customers</span><strong>{overview.stats.customers.total}</strong><small>registered customers</small></div>
                <div><span>Active products</span><strong>{overview.stats.products.active}</strong><small>{overview.stats.products.stock} units in stock</small></div>
                <div><span>Revenue</span><strong>{money(overview.stats.revenuePaise)}</strong><small>excluding cancelled/refunded</small></div>
              </div>

              <section className="admin-panel">
                <div className="admin-panel-head"><div><p className="dashboard-kicker">Recent activity</p><h2>Latest orders</h2></div><Link to="/admin/orders">View all →</Link></div>
                <div className="admin-table-wrap">
                  <table><thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Total</th><th>Date</th></tr></thead>
                  <tbody>{overview.recentOrders.map(order => <tr key={order.id}><td>#{order.id.slice(0,8).toUpperCase()}</td><td>{order.customer_name}<small>{order.customer_email}</small></td><td><span className="admin-pill">{order.status}</span></td><td>{money(order.total_paise)}</td><td>{dateLabel(order.created_at)}</td></tr>)}</tbody></table>
                </div>
              </section>

              <div className="admin-quick-grid">
                <button onClick={() => setTab('products')}><b>Manage products</b><span>Prices, stock, images and visibility</span></button>
                <button onClick={() => setTab('services')}><b>Manage services</b><span>Pricing, duration and availability</span></button>
                <button onClick={() => setTab('customers')}><b>View customers</b><span>Orders, bookings and customer value</span></button>
                <Link to="/admin/orders"><b>Process orders</b><span>Update order status and review details</span></Link>
                <Link to="/admin/bookings"><b>Appointments</b><span>Confirm or reject booking requests</span></Link>
                <Link to="/admin/support"><b>Support queue</b><span>Resolve customer requests</span></Link>
              </div>
            </>
          )}

          {tab === 'products' && (
            <section className="admin-management">
              <div className="admin-panel-head"><div><p className="dashboard-kicker">Catalogue</p><h2>{editingProduct ? 'Edit product' : 'Add product'}</h2></div></div>
              <form className="admin-form-grid" onSubmit={saveProduct}>
                <input required placeholder="Product name" value={productForm.name} onChange={e=>setProductForm({...productForm,name:e.target.value})}/>
                <input required placeholder="slug e.g. red-mehendi-oil" value={productForm.slug} onChange={e=>setProductForm({...productForm,slug:e.target.value})}/>
                <input required type="number" min="0" placeholder="Price in INR" value={productForm.pricePaise} onChange={e=>setProductForm({...productForm,pricePaise:e.target.value})}/>
                <input type="number" min="0" placeholder="Stock quantity" value={productForm.stockQuantity} onChange={e=>setProductForm({...productForm,stockQuantity:e.target.value})}/>
                <select value={productForm.categoryId} onChange={e=>setProductForm({...productForm,categoryId:e.target.value})}><option value="">No category</option>{(overview?.categories||[]).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
                <label className="admin-check"><input type="checkbox" checked={productForm.isActive} onChange={e=>setProductForm({...productForm,isActive:e.target.checked})}/> Visible in shop</label>
                <textarea className="wide" placeholder="Description" value={productForm.description} onChange={e=>setProductForm({...productForm,description:e.target.value})}/>
                <div className="wide admin-image-row"><input placeholder="Product image URL" value={imageUrl} onChange={e=>setImageUrl(e.target.value)}/><button type="button" onClick={addImage}>Add image</button></div>
                {productForm.images.length>0 && <div className="wide admin-image-list">{productForm.images.map((image,i)=><div key={i}><span>{image.imageUrl}</span><button type="button" onClick={()=>setProductForm({...productForm,images:productForm.images.filter((_,x)=>x!==i)})}>Remove</button></div>)}</div>}
                <div className="wide admin-form-actions"><button className="admin-primary" disabled={saving}>{saving ? 'Saving…' : editingProduct ? 'Save changes' : 'Create product'}</button>{editingProduct&&<button type="button" onClick={()=>{setEditingProduct(null);setProductForm(emptyProduct)}}>Cancel</button>}</div>
              </form>

              <div className="admin-panel-head admin-list-head"><div><p className="dashboard-kicker">Inventory</p><h2>Products</h2></div><input className="admin-search" placeholder="Search products…" value={productSearch} onChange={e=>setProductSearch(e.target.value)}/></div>
              <div className="admin-management-list">{filteredProducts.map(p=><article key={p.id}><div><strong>{p.name}</strong><span>{p.categoryName||'Uncategorised'} · {money(p.pricePaise)} · {p.stockQuantity} in stock</span></div><span className={p.isActive?'admin-pill':'admin-pill muted'}>{p.isActive?'Active':'Hidden'}</span><button onClick={()=>editProduct(p)}>Edit</button><button onClick={()=>deactivateProduct(p.id)} disabled={!p.isActive}>Hide</button></article>)}</div>
            </section>
          )}

          {tab === 'services' && (
            <section className="admin-management">
              <div className="admin-panel-head"><div><p className="dashboard-kicker">Appointments</p><h2>{editingService ? 'Edit service' : 'Add service'}</h2></div></div>
              <form className="admin-form-grid" onSubmit={saveService}>
                <input required placeholder="Service name" value={serviceForm.name} onChange={e=>setServiceForm({...serviceForm,name:e.target.value})}/>
                <input required placeholder="slug" value={serviceForm.slug} onChange={e=>setServiceForm({...serviceForm,slug:e.target.value})}/>
                <select value={serviceForm.level} onChange={e=>setServiceForm({...serviceForm,level:e.target.value})}><option value="basic">Basic</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="bridal">Bridal</option></select>
                <input required type="number" min="0" placeholder="Price in INR" value={serviceForm.pricePaise} onChange={e=>setServiceForm({...serviceForm,pricePaise:e.target.value})}/>
                <input type="number" min="0" placeholder="Duration in minutes" value={serviceForm.durationMinutes} onChange={e=>setServiceForm({...serviceForm,durationMinutes:e.target.value})}/>
                <label className="admin-check"><input type="checkbox" checked={serviceForm.isActive} onChange={e=>setServiceForm({...serviceForm,isActive:e.target.checked})}/> Available for booking</label>
                <textarea className="wide" placeholder="Description" value={serviceForm.description} onChange={e=>setServiceForm({...serviceForm,description:e.target.value})}/>
                <div className="wide admin-form-actions"><button className="admin-primary" disabled={saving}>{saving?'Saving…':editingService?'Save changes':'Create service'}</button>{editingService&&<button type="button" onClick={()=>{setEditingService(null);setServiceForm(emptyService)}}>Cancel</button>}</div>
              </form>
              <div className="admin-panel-head admin-list-head"><div><p className="dashboard-kicker">Service catalogue</p><h2>Services</h2></div><input className="admin-search" placeholder="Search services…" value={serviceSearch} onChange={e=>setServiceSearch(e.target.value)}/></div>
              <div className="admin-management-list">{filteredServices.map(s=><article key={s.id}><div><strong>{s.name}</strong><span>{s.level} · {money(s.price_paise)} · {s.duration_minutes || '—'} min</span></div><span className={s.is_active?'admin-pill':'admin-pill muted'}>{s.is_active?'Active':'Hidden'}</span><button onClick={()=>{setEditingService(s.id);setServiceForm({name:s.name,slug:s.slug,level:s.level,description:s.description||'',pricePaise:(Number(s.price_paise)/100).toFixed(2),durationMinutes:s.duration_minutes||'',isActive:s.is_active})}}>Edit</button><button onClick={()=>toggleService(s)}>{s.is_active?'Hide':'Restore'}</button></article>)}</div>
            </section>
          )}

          {tab === 'customers' && (
            <section className="admin-panel">
              <div className="admin-panel-head"><div><p className="dashboard-kicker">Customer database</p><h2>Registered customers</h2></div><input className="admin-search" placeholder="Search name or email…" value={customerSearch} onChange={e=>setCustomerSearch(e.target.value)}/></div>
              <div className="admin-table-wrap"><table><thead><tr><th>Customer</th><th>Orders</th><th>Bookings</th><th>Lifetime value</th><th>Joined</th></tr></thead><tbody>{filteredCustomers.map(c=><tr key={c.id}><td><strong>{c.name}</strong><small>{c.email}</small></td><td>{c.order_count}</td><td>{c.booking_count}</td><td>{money(c.lifetime_value_paise)}</td><td>{dateLabel(c.created_at)}</td></tr>)}</tbody></table></div>
            </section>
          )}
        </div>
      </section>
    </main>
  )
}
