import { Link } from 'react-router-dom'

export default function ProductDetails() {
  return (
    <main className="products-coming-soon-standalone">
      <div className="products-coming-soon-standalone-card">
        <p className="products-coming-soon-label">Alfiya Mehendi</p>
        <h1>Products are <em>coming soon.</em></h1>
        <p>
          The product collection is still being planned. Please check back later.
        </p>
        <Link to="/products" className="products-primary-link">
          Back to shop <span>→</span>
        </Link>
      </div>
    </main>
  )
}
