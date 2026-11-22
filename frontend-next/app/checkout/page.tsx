"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardSidebar from "../../components/dashboard/Sidebar";

export default function Checkout() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function load() {
      const token =
        typeof window !== "undefined"
          ? sessionStorage.getItem("alfiya_auth_token")
          : "";
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/cart", {
          headers: { Authorization: "Bearer " + token },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to load cart.");
        setItems(data.items || []);
        setTotal(data.total || 0);
      } catch (e: any) {
        setError(e.message || "Unable to load cart.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);


  const handlePlaceOrder = async () => {
    // Would call /api/orders in a full implementation
    setError("Order placement not implemented in this phase.");
  };

  return (
    <main className="shop-dashboard checkout-dashboard">
      <DashboardSidebar active="help" />

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <p className="dashboard-kicker">Checkout</p>
            <h1>Review your order</h1>
          </div>
          <Link href="/cart">Back to cart</Link>
        </header>

        <section className="dashboard-content">
          {typeof window !== "undefined" && !sessionStorage.getItem("alfiya_auth_token") && (
            <div>
              <p className="dashboard-kicker">Account required</p>
              <h2>Log in to checkout.</h2>
              <p>Your purchases are connected to your account.</p>
              <Link href="/login">Log in</Link>
            </div>
          )}

          {typeof window !== "undefined" && sessionStorage.getItem("alfiya_auth_token") && loading && (
            <p>Loading your cart…</p>
          )}

          {typeof window !== "undefined" && sessionStorage.getItem("alfiya_auth_token") && error && (
            <p>{error}</p>
          )}

          {typeof window !== "undefined" && sessionStorage.getItem("alfiya_auth_token") && !loading && items.length === 0 && (
            <p>Your cart is empty.</p>
          )}

          {typeof window !== "undefined" && sessionStorage.getItem("alfiya_auth_token") && !loading && items.length > 0 && (
            <div>
              <h2>Cart items</h2>
              <ul>
                {items.map((item: any, i: number) => (
                  <li key={i}>
                    <span>{item.name}</span>
                    <span>₹{item.price}</span>
                  </li>
                ))}
              </ul>
              <p>Total: ₹{total}</p>
              <button onClick={handlePlaceOrder}>Place order</button>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}