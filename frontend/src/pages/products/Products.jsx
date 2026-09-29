import DashboardSidebar from '../../components/DashboardSidebar.jsx'
import { Link } from 'react-router-dom'
import { useState } from 'react'

function getUser() {
  try {
    return JSON.parse(sessionStorage.getItem('alfiya_user') || '{}')
  } catch {
    return {}
  }
}

export default function Products() {
  const [user] = useState(getUser)
  const firstName = user?.name?.split(' ')?.[0] || 'there'

  return (
    <main className="shop-dashboard products-coming-soon-page">
      <DashboardSidebar active="shop" />

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <p className="dashboard-kicker">Alfiya Mehendi</p>
            <h1>Shop</h1>
          </div>

          <div className="dashboard-top-actions">
            <Link to="/services" className="products-services-link">
              Explore mehendi services <span>→</span>
            </Link>
          </div>
        </header>

        <div className="dashboard-content products-coming-soon-content">
          <section className="products-coming-soon-hero" aria-labelledby="products-coming-soon-title">
            <div className="products-coming-soon-copy">
              <p className="products-coming-soon-label">Something is being prepared</p>
              <h2 id="products-coming-soon-title">
                Products are<br />
                <em>coming soon.</em>
              </h2>
              <p className="products-coming-soon-description">
                We are carefully planning the Alfiya Mehendi product collection.
                The shop will open once the products are ready.
              </p>

              <div className="products-coming-soon-note">
                <span className="products-status-dot" aria-hidden="true"></span>
                <div>
                  <strong>Stay tuned</strong>
                  <small>We’ll have powders, oils, tools and mehendi supplies here.</small>
                </div>
              </div>

              <Link to="/services" className="products-primary-link">
                Book a mehendi service <span>→</span>
              </Link>
            </div>

            <div className="products-coming-soon-art" aria-hidden="true">
              <div className="products-art-ring products-art-ring-one"></div>
              <div className="products-art-ring products-art-ring-two"></div>
              <div className="products-art-cone">
                <span></span>
              </div>
              <div className="products-art-leaf products-art-leaf-one"></div>
              <div className="products-art-leaf products-art-leaf-two"></div>
              <div className="products-art-dot products-art-dot-one"></div>
              <div className="products-art-dot products-art-dot-two"></div>
              <div className="products-art-caption">ALFIYA · MEHENDI</div>
            </div>
          </section>


    </main>
  )
}
