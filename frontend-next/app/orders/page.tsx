"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";

function money(paise: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    (Number(paise) || 0) / 100,
  );
}

function dateLabel(value: string | number | Date | null) {
  return value ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)) : "";
}

export default function Orders() {
  const [orders, setOrders] = useState<{ id: string; customer_name: string; customer_email: string; created_at: string; status: string; total_paise: number; }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? sessionStorage.getItem("alfiya_auth_token") : "";
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    fetch("/api/orders/mine", {
      headers: { Authorization: "Bearer " + token },
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to load orders.");
        setOrders(data.orders || []);
      })
      .catch((e: any) => {
        setError(e.message || "Unable to load your orders.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <main className="page orders-page">
      <Header />

      <section className="orders-hero">
        <div className="container">
          <p className="eyebrow">Alfiya Mehendi Store</p>
          <h1>My orders.</h1>
        </div>
      </section>

      <section className="orders-content">
        <div className="container">
          {typeof window !== "undefined" && !sessionStorage.getItem("alfiya_auth_token") && (
            <div className="empty-state">
              <div className="empty-state-mark">✦</div>
              <p className="eyebrow">Account required</p>
              <h2>Log in to see your orders.</h2>
              <p>Your purchases are connected to your account.</p>
              <Link href="/login" className="btn btn-primary btn-block">
                Log in
              </Link>
            </div>
          )}

          {typeof window !== "undefined" && sessionStorage.getItem("alfiya_auth_token") && loading && (
            <div className="loading-state">
              <div className="skeleton skeleton-title"></div>
              <p>Loading your orders…</p>
            </div>
          )}

          {typeof window !== "undefined" && sessionStorage.getItem("alfiya_auth_token") && error && (
            <div className="error-state">
              <p className="error-title">Unable to load orders</p>
              <p>{error}</p>
            </div>
          )}

          {typeof window !== "undefined" && sessionStorage.getItem("alfiya_auth_token") && !loading && !error && orders.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-mark">✦</div>
              <h2>No orders yet.</h2>
              <p>You don't have any orders. Your purchases will appear here when you place an order.</p>
            </div>
          )}

          {typeof window !== "undefined" && sessionStorage.getItem("alfiya_auth_token") && !loading && !error && orders.length > 0 && (
            <>
              <p className="orders-count">{orders.length} {orders.length === 1 ? "order" : "orders"}</p>
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <strong>Order #{o.id.slice(0, 8).toUpperCase()}</strong>
                        </td>
                        <td>
                          <div>
                            <strong>{o.customer_name}</strong>
                            <br />
                            <span style={{ color: "var(--text-secondary)", fontSize: "var(--text-xs)" }}>{o.customer_email}</span>
                          </div>
                        </td>
                        <td>{dateLabel(o.created_at)}</td>
                        <td>
                          <span className={`status-badge status-${o.status}`}>{o.status}</span>
                        </td>
                        <td>{money(o.total_paise)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
