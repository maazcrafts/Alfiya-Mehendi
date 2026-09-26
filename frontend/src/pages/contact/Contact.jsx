import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardSidebar from '../../components/DashboardSidebar.jsx'

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const faqs = [
  {
    category: 'Shopping',
    question: 'How do I place an order?',
    answer: 'Open Shop, choose a product, add it to your cart, review the quantities, and continue to checkout.'
  },
  {
    category: 'Appointments',
    question: 'How do I book a mehendi appointment?',
    answer: 'Open Mehendi Services, choose the design level and service you want, then select an available date and time.'
  },
  {
    category: 'Appointments',
    question: 'Is my appointment confirmed immediately?',
    answer: 'No. A booking request stays pending until the Alfiya Mehendi admin confirms it. You can see the current status in My Bookings.'
  },
  {
    category: 'Orders',
    question: 'Where can I see my order status?',
    answer: 'Open My Orders from the sidebar. Your orders are grouped by status and can be expanded for item and total details.'
  },
  {
    category: 'Account',
    question: 'How do I reset my password?',
    answer: 'Use Forgot password on the login page and follow the reset link generated for your account.'
  },
  {
    category: 'Bookings',
    question: 'Can I cancel a booking request?',
    answer: 'Pending booking requests can be cancelled from My Bookings. Confirmed appointments follow the business cancellation process.'
  },
]

const quickHelp = [
  { title: 'Order help', text: 'Track products, order status and order details.', href: '/orders', label: 'Open My Orders' },
  { title: 'Appointment help', text: 'Check your booking status or cancel a pending request.', href: '/booking', label: 'Open My Bookings' },
  { title: 'Shopping help', text: 'Browse mehendi powders, oils, tools and supplies.', href: '/products', label: 'Go to Shop' },
  { title: 'Service help', text: 'Compare mehendi services and choose a design.', href: '/services', label: 'View Services' },
  { title: 'Payment help', text: 'Need help with a payment or checkout issue?', href: '#contact-form', label: 'Contact support' },
  { title: 'Account help', text: 'Questions about login, password or your profile?', href: '/account', label: 'Open Profile' },
]

function getUser() {
  try { return JSON.parse(localStorage.getItem('alfiya_user') || '{}') } catch { return {} }
}

export default function Contact() {
  const user = useMemo(getUser, [])
  const [openFaq, setOpenFaq] = useState(0)
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    reference: '',
    topic: 'Order',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState({ type: '', message: '' })

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  async function submitForm(event) {
    event.preventDefault()
    setFeedback({ type: '', message: '' })

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setFeedback({ type: 'error', message: 'Please complete your name, email and message.' })
      return
    }

    setSubmitting(true)
    try {
      const token = localStorage.getItem('alfiya_token')
      const response = await fetch(`${apiBase}/api/support`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          reference: form.reference.trim(),
          topic: form.topic,
          message: form.message.trim(),
        }),
      })
      const contentType = response.headers.get('content-type') || ''
      const data = contentType.includes('application/json') ? await response.json() : {}
      if (!response.ok) throw new Error(data.message || 'Unable to send your request.')

      setFeedback({
        type: 'success',
        message: 'Your support request has been received. We will review it and get back to you.',
      })
      setForm((current) => ({ ...current, reference: '', message: '' }))
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Unable to send your request right now.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="shop-dashboard contact-dashboard">
      <DashboardSidebar active="help" />

      <section className="dashboard-main">
        <header className="dashboard-topbar contact-topbar">
          <div>
            <p className="dashboard-kicker">Support centre</p>
            <h1>Help & Contact</h1>
          </div>
          <Link to="/products" className="contact-shop-link">Back to shop</Link>
        </header>

        <div className="dashboard-content contact-content">
          <section className="contact-hero">
            <div className="contact-hero-copy">
              <p className="dashboard-kicker">Need a hand?</p>
              <h2>How can we help?</h2>
              <p>
                Questions about your order, mehendi appointment, products or account?
                Start with a quick answer below or send the Alfiya Mehendi team a message.
              </p>
              <div className="contact-hero-actions">
                <a href="#quick-help" className="contact-primary-action">Find an answer <span>↓</span></a>
                <a href="#contact-form" className="contact-secondary-action">Contact support <span>→</span></a>
              </div>
            </div>

            <div className="contact-guide-scene" aria-label="Alfiya Mehendi support guide">
              <div className="contact-guide-speech">
                <strong>Hi there.</strong>
                <span>Tell me what you need help with.</span>
              </div>
              <div className="contact-guide">
                <div className="guide-hair"></div>
                <div className="guide-head"><span className="guide-eye left"></span><span className="guide-eye right"></span><span className="guide-smile"></span></div>
                <div className="guide-body"><span className="guide-neck"></span><span className="guide-floral floral-a"></span><span className="guide-floral floral-b"></span></div>
                <div className="guide-arm guide-arm-left"></div>
                <div className="guide-arm guide-arm-right"></div>
                <div className="guide-hand guide-hand-right"></div>
                <div className="guide-feet"><i></i><i></i></div>
              </div>
              <div className="guide-ground"></div>
            </div>
          </section>

          <section id="quick-help" className="contact-section">
            <div className="contact-section-heading">
              <div>
                <p className="dashboard-kicker">Quick help</p>
                <h2>Go straight to what you need.</h2>
              </div>
              <span>Choose a path</span>
            </div>
            <div className="quick-help-grid">
              {quickHelp.map((item) => (
                <Link key={item.title} to={item.href} className="quick-help-card">
                  <span className="quick-help-number">{String(quickHelp.indexOf(item) + 1).padStart(2, '0')}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                  <strong>{item.label} <span>→</span></strong>
                </Link>
              ))}
            </div>
          </section>

          <section className="contact-section faq-section">
            <div className="contact-section-heading">
              <div>
                <p className="dashboard-kicker">Frequently asked</p>
                <h2>Answers before you ask.</h2>
              </div>
              <span>{faqs.length} answers</span>
            </div>

            <div className="faq-list">
              {faqs.map((faq, index) => {
                const open = openFaq === index
                return (
                  <button
                    key={faq.question}
                    type="button"
                    className={`faq-item ${open ? 'open' : ''}`}
                    onClick={() => setOpenFaq(open ? -1 : index)}
                    aria-expanded={open}
                  >
                    <span className="faq-index">{String(index + 1).padStart(2, '0')}</span>
                    <span className="faq-copy">
                      <small>{faq.category}</small>
                      <strong>{faq.question}</strong>
                      {open && <span className="faq-answer">{faq.answer}</span>}
                    </span>
                    <span className="faq-toggle">{open ? '−' : '+'}</span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="contact-direct">
            <div>
              <p className="dashboard-kicker">Still need help?</p>
              <h2>Talk to the Alfiya team.</h2>
              <p>Use the support form and include your order or booking reference when relevant. It helps us understand the issue faster.</p>
            </div>
            <div className="contact-direct-actions">
              <a href="#contact-form" className="direct-card">
                <span className="direct-icon">WA</span>
                <div><strong>WhatsApp</strong><small>Message support</small></div>
                <b>→</b>
              </a>
              <a href="#contact-form" className="direct-card">
                <span className="direct-icon">@</span>
                <div><strong>Email</strong><small>Send a support request</small></div>
                <b>→</b>
              </a>
              <a href="#contact-form" className="direct-card">
                <span className="direct-icon">☎</span>
                <div><strong>Call back</strong><small>Request help from the team</small></div>
                <b>→</b>
              </a>
            </div>
          </section>

          <section id="contact-form" className="contact-form-section">
            <div className="contact-form-intro">
              <p className="dashboard-kicker">Contact support</p>
              <h2>Send us a message.</h2>
              <p>Give us enough detail to identify your order or booking and we can route the request correctly.</p>
              <div className="contact-form-note">
                <span>01</span><p>Your request is saved securely in the support queue.</p>
              </div>
              <div className="contact-form-note">
                <span>02</span><p>Order or booking references are optional, but useful for faster help.</p>
              </div>
            </div>

            <form className="support-form" onSubmit={submitForm}>
              <div className="support-form-row">
                <label><span>Your name</span><input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Full name" /></label>
                <label><span>Email address</span><input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" /></label>
              </div>
              <div className="support-form-row">
                <label><span>Order / Booking ID <em>optional</em></span><input value={form.reference} onChange={(e) => update('reference', e.target.value)} placeholder="e.g. order or booking reference" /></label>
                <label><span>What can we help with?</span>
                  <select value={form.topic} onChange={(e) => update('topic', e.target.value)}>
                    <option>Order</option><option>Appointment</option><option>Product</option><option>Payment</option><option>Account</option><option>Other</option>
                  </select>
                </label>
              </div>
              <label className="support-message-field"><span>Your message</span><textarea value={form.message} onChange={(e) => update('message', e.target.value)} placeholder="Tell us what happened or what you need help with…" rows="7" /></label>

              {feedback.message && <div className={`support-feedback ${feedback.type}`}>{feedback.message}</div>}

              <button className="support-submit" type="submit" disabled={submitting}>
                {submitting ? 'Sending request…' : 'Send support request'}
                <span>→</span>
              </button>
            </form>
          </section>
        </div>
      </section>
    </main>
  )
}
