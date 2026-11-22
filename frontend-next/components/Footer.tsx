"use client";

"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const FOOTER_LINKS = [
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
];

export function Footer() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  const supportEmail = "khanalfiya70399@gmail.com";
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("alfiya_auth_token")
      : null;

  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-brand">
          <span className="logo-mark">✦</span>
          <span className="logo-copy">
            <strong>Alfiya</strong>
            <span className="logo-sub">MEHENDI</span>
          </span>
          <p className="footer-brand-note">
            Professional mehendi services for weddings, bridal, and special occasions.
          </p>
        </div>

        <nav className="footer-nav" aria-label="Footer navigation">
          {FOOTER_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="footer-link">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="footer-contact">
          <p className="footer-contact-label">Get in touch</p>
          <a href={`mailto:${supportEmail}`} className="footer-email">
            {supportEmail}
          </a>
          {token && (
            <Link href="/account" className="footer-link footer-link-soft">
              My account
            </Link>
          )}
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-copyright">
          © {year} Alfiya Mehendi. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
