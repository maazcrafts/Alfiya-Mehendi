import { useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardSidebar from '../../components/DashboardSidebar.jsx'

const supportEmail = 'khanalfiya70399@gmail.com'

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
  { title: 'Payment help', text: 'Need help with a payment or checkout issue?', href: '#contact-email', label: 'Email us' },
  { title: 'Account help', text: 'Questions about login, password or your profile?', href: '/account', label: 'Open Profile' },
]

export default function Contact() {
  const [openFaq, setOpenFaq] = useState(0)
  const [faqSearch, setFaqSearch] = useState('')

  const filteredFaqs = faqs.filter((faq) =>
    `${faq.category} ${faq.question} ${faq.answer}`
      .toLowerCase()
      .includes(faqSearch.trim().toLowerCase())
  )

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
                Find a quick answer below or contact the Alfiya Mehendi team by email.
              </p>
              <div className="contact-hero-actions">
                <a href="#quick-help" className="contact-primary-action">Find an answer <span>↓</span></a>
                <a href="#contact-email" className="contact-secondary-action">Email support <span>→</span></a>
              </div>
            </div>

            <div className="contact-guide-scene" aria-label="Alfiya Mehendi support guide">
              <div className="contact-guide-speech">
                <strong>Hi there.</strong>
                <span>Tell us what you need help with.</span>
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
              {quickHelp.map((item, index) => (
                <Link key={item.title} to={item.href} className="quick-help-card">
                  <span className="quick-help-number">{String(index + 1).padStart(2, '0')}</span>
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
            <div className="faq-search-wrap">
              <input
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder="Search help topics…"
                aria-label="Search help topics"
              />
            </div>
            <div className="contact-section-heading">
              <div>
                <p className="dashboard-kicker">Frequently asked</p>
                <h2>Answers before you ask.</h2>
              </div>
              <span>{filteredFaqs.length} answers</span>
            </div>

            <div className="faq-list">
              {filteredFaqs.map((faq, index) => {
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

          <section id="contact-email" className="contact-email-section">
            <div className="contact-email-copy">
              <p className="dashboard-kicker">Requests & complaints</p>
              <h2>Contact us by email.</h2>
              <p>
                For any order request, appointment issue, product question, payment issue
                or complaint, email the Alfiya Mehendi team directly.
              </p>
              <div className="contact-email-address">{supportEmail}</div>
              <div className="contact-form-note">
                <span>01</span><p>Include your order or booking ID when relevant.</p>
              </div>
              <div className="contact-form-note">
                <span>02</span><p>Describe the request or complaint clearly so the team can respond.</p>
              </div>
            </div>

            <div className="contact-email-action">
              <div className="email-symbol">@</div>
              <p>Email support</p>
              <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${supportEmail}`}
                target="_blank"
                rel="noreferrer"
              >
                Open Gmail <span>→</span>
              </a>
              <a className="email-text-link" href={`mailto:${supportEmail}`}>
                Or use your email app
              </a>
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}
