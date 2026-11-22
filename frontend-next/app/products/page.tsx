import Link from "next/link";
import { Metadata } from "next";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";

const productStatus = {
  label: "Coming soon",
  noteStrong: "Stay tuned",
  noteSmall: "The shop will be updated when products are ready.",
  ctaText: "Book a mehendi service →",
  ctaHref: "/services",
  caption: "ALFIYA · MEHENDI",
};

/** Server Component metadata */
export const metadata: Metadata = {
  title: "Alfiya Mehendi Products | Coming Soon",
  description:
    "Alfiya Mehendi products are coming soon. Stay tuned for mehendi powders, tools, and oils. Book a mehendi service in the meantime.",
  keywords:
    "alfiya mehendi products, mehendi powders, mehendi tools, mehendi oils, alfiya products",
  alternates: {
    canonical: "/products",
  },
};

export default function Products() {
  return (
    <main className="page">
      <Header />

      <section className="products-coming-soon">
        <div className="container">
          <p className="eyebrow">{productStatus.label}</p>
          <h1>
            Products are<br />
            <em>coming soon.</em>
          </h1>
          <p className="products-description">
            Our product collection is still being planned. We’ll open the shop
            when the products are ready.
          </p>
          <div className="products-status">
            <span className="products-status-dot" aria-hidden="true"></span>
            <div>
              <strong>{productStatus.noteStrong}</strong>
              <small>{productStatus.noteSmall}</small>
            </div>
          </div>
          <Link href={productStatus.ctaHref} className="btn btn-primary btn-block">
            {productStatus.ctaText}
          </Link>
        </div>
      </section>

      <section className="products-service-preview">
        <div className="container">
          <p className="eyebrow">In the meantime</p>
          <h2>Book a mehendi service</h2>
          <p className="products-preview-description">
            Explore our service catalogue — from basic designs to full bridal
            coverage — and book your appointment online.
          </p>
          <Link href="/services" className="btn btn-ghost">
            View services →
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
