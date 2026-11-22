"use client";

import DashboardSidebar from "../../../components/dashboard/Sidebar";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const filters = [["all", "All"], ["new", "New"], ["in_progress", "In progress"], ["resolved", "Resolved"]];

function token() {
  return typeof window !== "undefined"
    ? sessionStorage.getItem("alfiya_auth_token") || ""
    : "";
}

function dateLabel(value: string | number | Date | null) {
  return value ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value)) : "";
}

export default function AdminSupport() {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [requests, setRequests] = useState<{ id: string; name: string; email: string; topic: string; message: string; reference?: string; status: string; created_at: string; }[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [filter]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`/api/support/admin?status=${filter}`, {
        headers: { Authorization: "Bearer " + token() },
      });
      const d = await r.json().catch(() => ({}));
      if (r.status === 401 || r.status === 403) {
        router.push("/services");
        throw new Error(d.message || "Administrator access required.");
      }
      if (!r.ok) throw new Error(d.message || "Unable to load support requests.");
      setRequests(d.requests || []);
    } catch (e: any) {
      setError(e.message || "Unable to load support requests.");
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(id: string, status: string) {
    setSaving(id);
    setError("");
    try {
      const r = await fetch(`/api/support/admin/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token() },
        body: JSON.stringify({ status }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Unable to update request.");
      setRequests(current => current.map(item => item.id === id ? { ...item, status } : item));
    } catch (err: any) {
      setError(err.message || "Unable to update request.");
    } finally {
      setSaving(null);
    }
  }

  const visible = requests.filter(r => !query.trim() || [r.id, r.name, r.email, r.topic, r.message, r.reference].join(" ").toLowerCase().includes(query.trim().toLowerCase()));
  const newCount = requests.filter(r => r.status === "new").length;

  let content;
  if (loading) {
    content = <div className="loading-state"><p>Loading support requests…</p></div>;
  } else if (visible.length === 0) {
    content = <div className="empty-state"><div className="empty-state-mark">✦</div><h2>No support requests here.</h2><p>Customer messages will appear automatically when submitted.</p></div>;
  } else {
    content = (
      <div className="admin-support-list">
        {visible.map(item => {
          const isOpen = open === item.id;
          return (
            <article className="admin-support-card" key={item.id}>
              <button className="admin-support-head" type="button" onClick={() => setOpen(isOpen ? null : item.id)}>
                <div><span>TICKET #{item.id.slice(0,8).toUpperCase()}</span><h3>{item.topic} · {item.name}</h3><p>{item.email} · {dateLabel(item.created_at)}</p></div>
                <div className="admin-support-head-right"><span className={`booking-status booking-status-${item.status}`}>{item.status==='in_progress'?'In progress':item.status==='new'?'New':'Resolved'}</span><strong>{isOpen?'−':'+'}</strong></div>
              </button>
              {isOpen && <div className="admin-support-details">
                <div className="admin-support-meta"><span><b>Customer</b>{item.name}</span><span><b>Email</b>{item.email}</span><span><b>Reference</b>{item.reference||'Not provided'}</span></div>
                <div className="admin-support-message"><small>MESSAGE</small><p>{item.message}</p></div>
                <div className="admin-support-actions"><span>Update request status</span><div>{[['new','New'],['in_progress','In progress'],['resolved','Resolved']].map(([s,l])=><button key={s} disabled={saving===item.id} className={`admin-status-btn ${item.status===s?'active':''}`} onClick={()=>changeStatus(item.id,s)}>{l}</button>)}</div></div>
              </div>}
            </article>
          );
        })}
      </div>
    );
  }

  return (
    <main className="shop-dashboard admin-dashboard">
      <DashboardSidebar active="admin-support" adminOnly />
      <section className="dashboard-main admin-main">
        <header className="dashboard-topbar admin-topbar">
          <div><p className="dashboard-kicker">Admin</p><h1>Support requests.</h1></div>
          <Link href="/admin/orders" className="services-shop-link">Customer orders →</Link>
        </header>
        <div className="dashboard-content admin-content">
          <section className="admin-intro-card"><div><p className="dashboard-kicker">Customer care queue</p><h2>Every support request submitted through Help & Contact.</h2></div><span>{newCount} new</span></section>
          <div className="admin-control-row"><input className="admin-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name, email, topic, reference or message…" /></div>
          <div className="admin-filter-row">{filters.map(([v,l])=><button key={v} type="button" className={`admin-filter-btn ${filter===v?'active':''}`} onClick={()=>setFilter(v)}>{l}</button>)}<button type="button" className="admin-filter-btn admin-refresh" onClick={load}>Refresh</button></div>
          {error&&<div className="booking-alert booking-alert-error">{error}</div>}
          {content}
        </div>
      </section>
    </main>
  );
}
