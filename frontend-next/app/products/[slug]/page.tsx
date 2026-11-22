import { notFound } from "next/navigation";
import Sidebar from "../../../components/dashboard/Sidebar";

export default function ProductDetails({ params }: { params: { slug: string } }) {
  const { slug } = params;

  if (!slug) {
    notFound();
  }

  return (
    <main className="products-coming-soon-standalone">
      <div className="products-coming-soon-standalone-card">
        <p className="products-coming-soon-label">Alfiya Mehendi</p>
        <h1>Products are <em>coming soon.</em></h1>
        <p>
          The product collection is still being planned. Please check back later.
        </p>
        <a href="/products" className="products-primary-link">
          Back to shop <span>→</span>
        </a>
      </div>
    </main>
  );
}