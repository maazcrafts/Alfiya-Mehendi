import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const icons = {
  shop: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg>,
  services: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 12V6.5a1.5 1.5 0 0 1 3 0V11M11 10V5.5a1.5 1.5 0 0 1 3 0V11M14 10V7a1.5 1.5 0 0 1 3 0v6M17 11.5V10a1.5 1.5 0 0 1 3 0v3.5c0 4-2.2 6.5-6.2 6.5H11c-2 0-3.2-1-4.1-2.5L4.7 14a1.5 1.5 0 0 1 2.6-1.5L9 15"/><path d="m5 5 1-2 1 2 2 1-2 1-1 2-1-2-2-1 2-1Z"/></svg>,
  orders: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-2.5-1.7L13 21l-3-1.7L7.5 21 6 19.3V3Z"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>,
  support: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H8l-4 4V5Z"/><path d="M8 9h8M8 12h5"/></svg>,
  bookings: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 9h16M8 13h.01M12 13h.01M16 13h.01M8 16h.01M12 16h.01"/></svg>,
  profile: <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.7-3.5 3-5.5 7-5.5s6.3 2 7 5.5"/></svg>,
  help: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13v-1a8 8 0 0 1 16 0v1"/><path d="M4 13h3v5H5.5A1.5 1.5 0 0 1 4 16.5V13ZM20 13h-3v5h1.5a1.5 1.5 0 0 1 1.5-1.5V13Z"/><path d="M17 19c-.7 1.2-2 2-4 2h-1"/></svg>,
  admin: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 19 6v5c0 4.8-2.8 8.2-7 10-4.2-1.8-7-5.2-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></svg>,
}



function getUser() {
  try { return JSON.parse(sessionStorage.getItem('alfiya_user') || '{}') } catch { return {} }
}

export default function DashboardSidebar({ active = 'shop', adminOnly = false }) {
  const user = getUser()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const firstName = user?.name?.split(' ')?.[0] || 'there'

  useEffect(() => {
    if (!mobileMenuOpen) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [mobileMenuOpen])

  const closeMobileMenu = () => setMobileMenuOpen(false)

  const workspace = [
    ['shop', '/products', 'Shop'],
    ['services', '/services', 'Mehendi Services'],
    ['orders', '/orders', 'My Orders'],
    ['bookings', '/booking', 'My Bookings'],
  ]

  const mobileControls = (
    <>
      <button
        type="button"
        className="mobile-menu-trigger"
        aria-label="Open navigation menu"
        aria-expanded={mobileMenuOpen}
        onClick={() => setMobileMenuOpen((open) => !open)}
      >
        <span></span><span></span><span></span>
      </button>

      {mobileMenuOpen && (
        <button
          type="button"
          className="mobile-menu-backdrop"
          aria-label="Close navigation menu"
          onClick={closeMobileMenu}
        />
      )}
    </>
  )

  return (
    <>
      {typeof document !== 'undefined' ? createPortal(mobileControls, document.body) : null}

      <aside className={`dashboard-sidebar ${mobileMenuOpen ? 'mobile-menu-open' : ''}`}>
        <Link to="/products" className="dashboard-brand" onClick={closeMobileMenu}>
          <img className="dashboard-brand-logo" src="/alfiya-logo.svg" alt="Alfiya Mehendi" />
          <span><strong>Alfiya</strong><small>MEHENDI</small></span>
        </Link>

        <div className="dashboard-section-label">{adminOnly ? 'Admin workspace' : 'Workspace'}</div>
        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          {adminOnly ? (
            <>
              <Link to="/admin" className={`dashboard-nav-item ${active === 'admin-dashboard' ? 'active' : ''}`} onClick={closeMobileMenu}>
                <span className="dashboard-nav-icon">{icons.admin}</span>Dashboard
              </Link>
              <Link to="/services" className="dashboard-nav-item" onClick={closeMobileMenu}>
                <span className="dashboard-nav-icon">{icons.services}</span>Customer view
              </Link>
              <Link to="/admin/bookings" className={`dashboard-nav-item ${active === 'admin' ? 'active' : ''}`} onClick={closeMobileMenu}>
                <span className="dashboard-nav-icon">{icons.bookings}</span>Appointments
              </Link>
              <Link to="/admin/orders" className={`dashboard-nav-item ${active === 'admin-orders' ? 'active' : ''}`} onClick={closeMobileMenu}>
                <span className="dashboard-nav-icon">{icons.orders}</span>Customer Orders
              </Link>
              <Link to="/admin/support" className={`dashboard-nav-item ${active === 'admin-support' ? 'active' : ''}`} onClick={closeMobileMenu}>
                <span className="dashboard-nav-icon">{icons.support}</span>Support Requests
              </Link>
            </>
          ) : (
            <>
              {workspace.map(([key, href, label]) => (
                <Link key={key} to={href} className={`dashboard-nav-item ${active === key ? 'active' : ''}`} onClick={closeMobileMenu}>
                  <span className="dashboard-nav-icon">{icons[key]}</span>{label}
                </Link>
              ))}
              {user?.role === 'admin' && (
                <Link to="/admin/bookings" className={`dashboard-nav-item ${active === 'admin' ? 'active' : ''}`} onClick={closeMobileMenu}>
                  <span className="dashboard-nav-icon">{icons.admin}</span>Admin Bookings
                </Link>
              )}
            </>
          )}
        </nav>

        {!adminOnly && <>
          <div className="dashboard-section-label">Account</div>
          <nav className="dashboard-nav">
            <Link to="/account" className={`dashboard-nav-item ${active === 'profile' ? 'active' : ''}`} onClick={closeMobileMenu}>
              <span className="dashboard-nav-icon">{icons.profile}</span>Profile
            </Link>
            <Link to="/contact" className={`dashboard-nav-item ${active === 'help' ? 'active' : ''}`} onClick={closeMobileMenu}>
              <span className="dashboard-nav-icon">{icons.help}</span>Help & Contact
            </Link>
          </nav>
        </>}

        {!adminOnly && <div className="dashboard-sidebar-bottom">
          <div className="dashboard-user-mini">
            <div className="dashboard-avatar">{user?.picture ? <img src={user.picture} alt="" /> : firstName.charAt(0).toUpperCase()}</div>
            <div><strong>{user?.name || 'Guest'}</strong><small>{user?.email || 'Explore Alfiya Mehendi'}</small></div>
          </div>
        </div>}
      </aside>
    </>
  )
}
