import DashboardSidebar from '../../components/DashboardSidebar.jsx'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const statusMeta = {
  pending: ['Order received', 'pending', 1],
  confirmed: ['Confirmed', 'confirmed', 2],
  processing: ['Preparing your order', 'confirmed', 3],
  shipped: ['On the way', 'confirmed', 4],
  delivered: ['Delivered', 'delivered', 5],
  cancelled: ['Cancelled', 'cancelled', 0],
  refunded: ['Refunded', 'cancelled', 0],
}

function token(){return sessionStorage.getItem('alfiya_auth_token')||''}
function getUser(){try{return JSON.parse(sessionStorage.getItem('alfiya_user')||'{}')}catch{return {}}}
function money(paise){return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format((paise||0)/100)}
function dateLabel(v){return new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'long',year:'numeric'}).format(new Date(v))}

export default function Orders(){
  const user=useMemo(getUser,[])
  const logged=Boolean(token())
  const [orders,setOrders]=useState([])
  const [loading,setLoading]=useState(logged)
  const [error,setError]=useState('')
  const [filter,setFilter]=useState('all')
  const [query,setQuery]=useState('')
  const [open,setOpen]=useState(null)

  useEffect(()=>{
    if(!logged){setLoading(false);return}
    const load=async()=>{
      setLoading(true);setError('')
      try{
        const r=await fetch(apiBase+'/api/orders/mine',{headers:{Authorization:'Bearer '+token()}})
        const type=r.headers.get('content-type')||''
        if(!type.includes('application/json')) throw Error('The orders service returned an unexpected response. Please restart the backend.')
        const d=await r.json()
        if(!r.ok) throw Error(d.message||'Unable to load orders.')
        setOrders(d.orders||[])
      }catch(e){setError(e.message||'Unable to load your orders.')}
      finally{setLoading(false)}
    }
    load()
  },[logged])

  const filtered=orders.filter(o=>{
    const matchesStatus=filter==='all'||o.status===filter
    const text=(o.items||[]).map(i=>i.productName).join(' ').toLowerCase()
    return matchesStatus&&(!query||text.includes(query.toLowerCase())||o.id.toLowerCase().includes(query.toLowerCase()))
  })

  const activeCount=orders.filter(o=>['pending','confirmed','processing','shipped'].includes(o.status)).length

  return <main className="shop-dashboard orders-dashboard">
    <DashboardSidebar active="orders"/>
    <section className="dashboard-main">
      <header className="dashboard-topbar orders-topbar">
        <div><p className="dashboard-kicker">Alfiya Mehendi Store</p><h1>My orders.</h1></div>
        <Link to="/products" className="services-shop-link">Shop supplies →</Link>
      </header>
      <div className="dashboard-content orders-content">
        {!logged&&<section className="orders-login-card"><p className="dashboard-kicker">Account required</p><h2>Log in to see your orders.</h2><p>Your purchases are connected to your account so you can track every order in one place.</p><Link to="/login" className="booking-primary-cta">Log in</Link></section>}
        {logged&&loading&&<div className="orders-loading"><span></span><span></span><span></span><p>Loading your orders…</p></div>}
        {logged&&error&&<div className="booking-alert booking-alert-error">{error}</div>}
        {logged&&!loading&&!error&&orders.length===0&&<section className="orders-empty-state">
          <div className="orders-empty-visual"><div className="orders-box"><i></i><b></b></div></div>
          <p className="dashboard-kicker">Your order space</p>
          <h2>Your shopping story starts here.</h2>
          <p>You don't have any orders yet. Explore our mehendi powders, oils, tools and cone supplies, then your purchases will appear here with their delivery status.</p>
          <Link to="/products" className="booking-primary-cta">Start shopping <span>→</span></Link>
        </section>}
        {logged&&!loading&&!error&&orders.length>0&&<>
          <section className="orders-overview">
            <div><p className="dashboard-kicker">Your purchases</p><h2>{orders.length} {orders.length===1?'order':'orders'}</h2></div>
            <div className="orders-overview-stat"><strong>{activeCount}</strong><span>active</span></div>
            <div className="orders-overview-stat"><strong>{orders.filter(o=>o.status==='delivered').length}</strong><span>delivered</span></div>
          </section>
          <section className="orders-controls">
            <label><span>Search</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search orders or products"/></label>
            <div><button type="button" className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>All</button>{['pending','confirmed','processing','shipped','delivered','cancelled','refunded'].map(s=><button type="button" key={s} className={filter===s?'active':''} onClick={()=>setFilter(s)}>{statusMeta[s][0]}</button>)}</div>
          </section>
          {filtered.length===0?<div className="orders-filter-empty"><h3>No orders match this view.</h3><p>Try another status or search term.</p></div>:<section className="orders-list">{filtered.map(o=>{const meta=statusMeta[o.status]||statusMeta.pending;const isOpen=open===o.id;return <article className="order-card" key={o.id}>
            <button className="order-card-head" type="button" onClick={()=>setOpen(isOpen?null:o.id)}>
              <div><span className="order-number">ORDER</span><h3>#{o.id.slice(0,8).toUpperCase()}</h3><p>{dateLabel(o.created_at)} · {(o.items||[]).length} {(o.items||[]).length===1?'item':'items'}</p></div>
              <div className="order-head-right"><span className={'order-status '+meta[1]}>{meta[0]}</span><strong>{money(o.total_paise)}</strong><span className="order-expand">{isOpen?'−':'+'}</span></div>
            </button>
            <div className="order-progress"><span className={meta[2]>=1?'reached':''}>Received</span><i></i><span className={meta[2]>=2?'reached':''}>Confirmed</span><i></i><span className={meta[2]>=3?'reached':''}>Preparing</span><i></i><span className={meta[2]>=4?'reached':''}>Shipped</span><i></i><span className={meta[2]>=5?'reached':''}>Delivered</span></div>
            {isOpen&&<div className="order-details"><div className="order-items">{(o.items||[]).map(i=><div className="order-item" key={i.id}><div><strong>{i.productName}</strong><span>Qty {i.quantity}</span></div><b>{money(i.lineTotalPaise)}</b></div>)}</div><div className="order-total-row"><span>Subtotal</span><b>{money(o.subtotal_paise)}</b></div><div className="order-total-row"><span>Shipping</span><b>{money(o.shipping_paise)}</b></div><div className="order-total-row final"><span>Total</span><b>{money(o.total_paise)}</b></div></div>}
          </article>})}</section>}
        </>}
      </div>
    </section>
  </main>
}
