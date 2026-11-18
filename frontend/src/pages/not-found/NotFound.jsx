import DashboardSidebar from '../../components/DashboardSidebar.jsx'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="shop-dashboard services-dashboard">
      <DashboardSidebar active="services" />

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <p className="dashboard-kicker">Page not found</p>
            <h1>We couldn&rsquo;t find that page.</h1>
          </div>
        </header>

        <div className="dashboard-content services-content">
          <section className="services-state">
            <h3>Page Not Found</h3>
            <p>The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.</p>
            <Link to="/services" className="booking-primary-cta">Back to services</Link>
          </section>
        </div>
      </section>
    </main>
  )
}
