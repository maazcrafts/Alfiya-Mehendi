"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join("") || "A";
}

export default function Account() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== "undefined" ? sessionStorage.getItem("alfiya_auth_token") || "" : "";

  useEffect(() => {
    if (token) {
      setUser({ name: "Alfiya Customer", email: "customer@alfiya.mehendi" });
    } else {
      router.push("/login");
    }
    setLoading(false);
  }, [token, router]);

  if (loading) {
    return null;
  }

  const profile = user || { name: "Alfiya Customer", email: "customer@alfiya.mehendi" };

  return (
    <main className="page account-page">
      <Header />

      <section className="account-hero">
        <div className="container">
          <div className="account-header">
            <div>
              <p className="eyebrow">Your account</p>
              <h1>Profile</h1>
            </div>
            <Link href="/services" className="btn btn-ghost btn-sm">
              Back to services <span>→</span>
            </Link>
          </div>

          <div className="account-profile-card">
            <div className="account-avatar">
              <span className="account-avatar-initials">{initials(profile.name)}</span>
            </div>
            <div className="account-profile-info">
              <p className="account-kicker">Alfiya customer</p>
              <h2>{profile.name}</h2>
              <p>{profile.email}</p>
            </div>
            <div className="account-status">
              <span className="status-badge status-confirmed">Active</span>
            </div>
          </div>

          <section className="account-stats">
            <div className="account-stat">
              <span className="account-stat-number">0</span>
              <span className="account-stat-label">Orders placed</span>
            </div>
            <div className="account-stat">
              <span className="account-stat-number">0</span>
              <span className="account-stat-label">Appointments</span>
            </div>
          </section>
        </div>
      </section>

      <section className="account-details">
        <div className="container">
          <div className="account-grid">
            <article className="account-card">
              <div className="account-card-heading">
                <div>
                  <p className="eyebrow">Personal details</p>
                  <h3>Your information</h3>
                </div>
              </div>
              <div className="account-detail-list">
                <div className="account-detail-item">
                  <span className="account-detail-label">Full name</span>
                  <strong className="account-detail-value">{profile.name}</strong>
                </div>
                <div className="account-detail-item">
                  <span className="account-detail-label">Email address</span>
                  <strong className="account-detail-value">{profile.email}</strong>
                </div>
              </div>
            </article>

            <article className="account-card">
              <div className="account-card-heading">
                <div>
                  <p className="eyebrow">Security</p>
                  <h3>Account access</h3>
                </div>
              </div>
              <div className="account-security-row">
                <span className="account-security-icon">✓</span>
                <div>
                  <strong>Password protected</strong>
                </div>
              </div>
              <Link href="/forgot-password" className="link-soft">
                Reset your password <span>→</span>
              </Link>
            </article>
          </div>

          <section className="account-session">
            <div className="account-session-heading">
              <div>
                <p className="eyebrow">Session</p>
                <h3>Sign out of this device</h3>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={() => {
                sessionStorage.removeItem("alfiya_auth_token");
                sessionStorage.removeItem("alfiya_user");
                router.replace("/login");
              }}
            >
              Log out <span>→</span>
            </button>
          </section>
        </div>
      </section>

      <Footer />
    </main>
  );
}
