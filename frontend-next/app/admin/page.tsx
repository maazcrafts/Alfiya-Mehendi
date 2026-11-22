"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardSidebar from "../../components/dashboard/Sidebar";

function getUser() {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("alfiya_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getToken() {
  try {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("alfiya_auth_token") || "";
  } catch {
    return "";
  }
}

function money(paise: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    (Number(paise) || 0) / 100,
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState(() => getUser());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    async function init() {
      try {
        const resp = await fetch("/api/admin/overview", {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(data.message || "Request failed.");
        setAdmin(data.admin || null);
        setStats({
          totalBookings: data.totalBookings || 0,
          pendingBookings: data.pendingBookings || 0,
          totalOrders: data.totalOrders || 0,
          totalRevenue: data.totalRevenue || 0,
        });
      } catch (e: any) {
        if (/administrator access required|authentication required/i.test(e.message || "")) {
          router.replace("/login");
        }
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  return (
    <main className="shop-dashboard admin-dashboard">
      <DashboardSidebar active="admin-dashboard" adminOnly={true} />
      <section className="dashboard-main admin-main">
        <header className="dashboard-topbar admin-topbar">
          <div>
            <p className="dashboard-kicker">Private admin workspace</p>
            <h1>Alfiya control center.</h1>
            <p className="admin-subtitle">Administrator</p>
          </div>
        </header>

        <div className="dashboard-content admin-content">
          {loading ? (
            <div className="loading-state">
              <div className="skeleton skeleton-title"></div>
              <p>Loading dashboard…</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p className="error-title">Unable to load dashboard</p>
              <p>{error}</p>
            </div>
          ) : (
            <>
              <div className="admin-metrics">
                <div className="admin-metric-card">
                  <p className="admin-metric-label">Total bookings</p>
                  <strong className="admin-metric-value">{stats.totalBookings}</strong>
                </div>
                <div className="admin-metric-card">
                  <p className="admin-metric-label">Pending approval</p>
                  <strong className="admin-metric-value">{stats.pendingBookings}</strong>
                </div>
                <div className="admin-metric-card">
                  <p className="admin-metric-label">Total orders</p>
                  <strong className="admin-metric-value">{stats.totalOrders}</strong>
                </div>
                <div className="admin-metric-card">
                  <p className="admin-metric-label">Total revenue</p>
                  <strong className="admin-metric-value">{money(stats.totalRevenue)}</strong>
                </div>
              </div>

              <div className="admin-quick-actions">
                <h2 className="admin-section-heading">Quick actions</h2>
                <div className="admin-actions-grid">
                  <Link href="/admin/bookings" className="btn btn-primary btn-block">
                    Manage appointments
                  </Link>
                  <Link href="/admin/orders" className="btn btn-secondary btn-block">
                    Customer orders
                  </Link>
                  <Link href="/admin/support" className="btn btn-ghost btn-block">
                    Support requests
                  </Link>
                  <Link href="/services" className="btn btn-ghost btn-block">
                    Customer view
                  </Link>
                </div>
              </div>

              <div className="admin-info">
                <h2 className="admin-section-heading">System status</h2>
                <p>
                  The admin workspace is operational. Use the sidebar to manage
                  appointments, orders, and support requests. All changes are
                  enforced server-side.
                </p>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
