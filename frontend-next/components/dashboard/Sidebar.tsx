"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function getUser() {
  try {
    return JSON.parse(
      typeof window !== "undefined"
        ? sessionStorage.getItem("alfiya_user") || "{}"
        : "{}"
    );
  } catch {
    return {};
  }
}

function getToken() {
  try {
    return sessionStorage.getItem("alfiya_auth_token") || "";
  } catch {
    return "";
  }
}

interface SidebarProps {
  active?: string;
  adminOnly?: boolean;
}

export default function DashboardSidebar({
  active = "shop",
  adminOnly = false,
}: SidebarProps) {
  const user = getUser();
  const firstName = user.name?.split(" ")?.slice(0, 2).map((part: string) => part[0]?.toUpperCase())?.join("") || "A";

  const icons = {
    shop: "🛍️",
    services: "🌿",
    bookings: "📅",
    orders: "📦",
    profile: "👤",
    help: "❓",
    admin: "🛠️",
  };

  const workspace = [
    ["shop", "/products", "Shop"],
    ["services", "/services", "Mehendi Services"],
    ["about", "/about", "About"],
    ["orders", "/orders", "My Orders"],
    ["bookings", "/booking", "My Bookings"],
  ];

  const isAdmin = user.role === "admin" || false;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const body = typeof document !== "undefined" ? document.body : undefined;
    if (body) {
      body.style.overflow = "hidden";
    }
    return () => {
      const body = typeof document !== "undefined" ? document.body : undefined;
      if (body) {
        body.style.overflow = "";
      }
    };
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <aside
        className="admin-sidebar"
        aria-label="Dashboard navigation"
      >
        <Link href="/services" className="admin-sidebar-brand">
          <span className="admin-sidebar-brand-mark">✦</span>
          <span className="admin-sidebar-brand-copy">
            <strong>Alfiya</strong>
            <span className="admin-sidebar-brand-sub">MEHENDI</span>
          </span>
        </Link>

        <nav className="admin-sidebar-nav" aria-label="Dashboard navigation">
          {adminOnly ? (
            <>
              <Link
                href="/admin"
                className={`admin-sidebar-nav-item ${active === "admin-dashboard" ? "active" : ""}`}
              >
                <span className="admin-sidebar-nav-icon">{icons.admin}</span>
                Dashboard
              </Link>
              <Link
                href="/services"
                className={`admin-sidebar-nav-item ${active === "services" ? "active" : ""}`}
              >
                <span className="admin-sidebar-nav-icon">{icons.services}</span>
                Customer view
              </Link>
              <Link
                href="/admin/bookings"
                className={`admin-sidebar-nav-item ${active === "admin-bookings" ? "active" : ""}`}
              >
                <span className="admin-sidebar-nav-icon">{icons.bookings}</span>
                Appointments
              </Link>
              <Link
                href="/admin/orders"
                className={`admin-sidebar-nav-item ${active === "admin-orders" ? "active" : ""}`}
              >
                <span className="admin-sidebar-nav-icon">{icons.orders}</span>
                Customer Orders
              </Link>
              <Link
                href="/admin/support"
                className={`admin-sidebar-nav-item ${active === "admin-support" ? "active" : ""}`}
              >
                <span className="admin-sidebar-nav-icon">🆘</span>
                Support Requests
              </Link>
            </>
          ) : (
            <>
              {workspace.map((item) => {
                const [key, href, label] = item;
                return (
                  <Link
                    key={key}
                    href={href}
                    className={`admin-sidebar-nav-item ${active === key ? "active" : ""}`}
                  >
                    <span className="admin-sidebar-nav-icon">{icons[key as keyof typeof icons]}</span>
                    {label}
                  </Link>
                );
              })}

              {isAdmin && (
                <Link
                  href="/admin/bookings"
                  className={`admin-sidebar-nav-item ${active === "admin-bookings" ? "active" : ""}`}
                >
                  <span className="admin-sidebar-nav-icon">{icons.admin}</span>
                  Admin Bookings
                </Link>
              )}
            </>
          )}

          {!adminOnly && (
            <>
              <div className="admin-sidebar-section-label">Account</div>
              <nav className="admin-sidebar-subnav">
                <Link
                  href="/account"
                  className={`admin-sidebar-nav-item ${active === "profile" ? "active" : ""}`}
                >
                  <span className="admin-sidebar-nav-icon">{icons.profile}</span>
                  Profile
                </Link>
                <Link
                  href="/contact"
                  className={`admin-sidebar-nav-item ${active === "help" ? "active" : ""}`}
                >
                  <span className="admin-sidebar-nav-icon">{icons.help}</span>
                  Help & Contact
                </Link>
              </nav>
              <div className="admin-sidebar-bottom">
                <div className="admin-sidebar-avatar">
                  {firstName.charAt(0).toUpperCase()}
                </div>
                <div className="admin-sidebar-user-info">
                  <strong>{user.name || "Guest"}</strong>
                  <small>{user.email || "Explore Alfiya Mehendi"}</small>
                </div>
              </div>
            </>
          )}
        </nav>
      </aside>

      {mobileMenuOpen && (
        <div
          className="admin-mobile-menu-overlay"
          onClick={closeMobileMenu}
        >
          <div className="admin-mobile-menu" onClick={(e) => e.stopPropagation()}>
            {workspace.map((item) => {
              const [key, href, label] = item;
              return (
                <Link
                  key={key}
                  href={href}
                  className="admin-mobile-nav-link"
                  onClick={closeMobileMenu}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
