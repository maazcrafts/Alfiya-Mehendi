"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page">
      <section className="error-state">
        <p className="error-title">404 — Page not found</p>
        <p>
          The page you're looking for doesn't exist. Please check the URL or
          return to the homepage.
        </p>
        <Link href="/" className="btn btn-primary">
          Go to homepage
        </Link>
      </section>
    </main>
  );
}
