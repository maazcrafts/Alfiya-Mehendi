"use client";

import * as React from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("alfiya_auth_token")
      : null;

  return (
    <header className="site-header">
      <a href="/" className="site-logo" aria-label="Alfiya Mehendi">
        <span className="logo-mark">✦</span>
        <span className="logo-copy">
          <strong>Alfiya</strong>
          <span className="logo-sub">MEHENDI</span>
        </span>
      </a>

      <nav className="site-nav" aria-label="Main navigation">
        {NAV_LINKS.map((item) => (
          <Link key={item.href} href={item.href} className="nav-link">
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="header-actions">
        {token ? (
          <>
            <Link href="/account" className="nav-link nav-link-soft">
              Account
            </Link>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                sessionStorage.removeItem("alfiya_auth_token");
                sessionStorage.removeItem("alfiya_user");
                window.location.replace("/login");
              }}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="nav-link nav-link-soft">
              Log in
            </Link>
            <Link href="/booking" className="btn btn-primary">
              Book
            </Link>
          </>
        )}

        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label="Toggle menu"
        >
          <span className="mobile-menu-icon" aria-hidden="true"></span>
        </button>
      </div>

      {mobileOpen && (
        <div
          id="mobile-menu"
          className="mobile-menu"
          onClick={() => setMobileOpen(false)}
        >
          <div className="mobile-menu-inner" onClick={(e) => e.stopPropagation()}>
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="mobile-nav-link"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {token ? (
              <>
                <Link
                  href="/account"
                  className="mobile-nav-link"
                  onClick={() => setMobileOpen(false)}
                >
                  Account
                </Link>
                <button
                  type="button"
                  className="btn btn-secondary btn-block"
                  onClick={() => {
                    sessionStorage.removeItem("alfiya_auth_token");
                    sessionStorage.removeItem("alfiya_user");
                    window.location.replace("/login");
                  }}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="mobile-nav-link"
                  onClick={() => setMobileOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/booking"
                  className="btn btn-primary btn-block"
                  onClick={() => setMobileOpen(false)}
                >
                  Book
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
