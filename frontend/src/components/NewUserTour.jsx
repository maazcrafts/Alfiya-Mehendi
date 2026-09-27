import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const steps = [
  {
    path: '/products',
    kicker: '01 · HOME',
    title: 'Welcome to Alfiya.',
    text: 'This is your main space. Shop mehendi supplies, search the catalogue, open your cart, and jump anywhere from the sidebar.',
    cue: 'Your whole Alfiya workspace starts here.',
  },
  {
    path: '/services',
    kicker: '02 · SERVICES',
    title: 'Choose your mehendi style.',
    text: 'Explore Basic, Intermediate, Advanced and Bridal services. Each service shows its style, price and booking action.',
    cue: 'Find the design level that fits your occasion.',
  },
  {
    path: '/booking',
    kicker: '03 · BOOKING',
    title: 'Booking is a simple 3-step journey.',
    text: 'Pick a date, choose an available time, review everything, then send your request. Confirmed appointments appear in My Bookings.',
    cue: 'Date → Time → Review → Request.',
  },
  {
    path: '/orders',
    kicker: '04 · ORDERS',
    title: 'Keep an eye on every order.',
    text: 'My Orders keeps your purchases together. Open an order to see its items, total and delivery progress.',
    cue: 'Your shopping history stays organised.',
  },
  {
    path: '/cart',
    kicker: '05 · CART',
    title: 'Your shopping basket.',
    text: 'Adjust quantities, remove products, check your subtotal and continue to checkout whenever you are ready.',
    cue: 'Nothing gets lost between browsing and checkout.',
  },
  {
    path: '/account',
    kicker: '06 · PROFILE',
    title: 'Your account, your control.',
    text: 'Edit your name, see your account status, manage security and jump directly to orders, bookings, cart or support.',
    cue: 'Everything personal stays in one place.',
  },
  {
    path: '/contact',
    kicker: '07 · HELP',
    title: 'And if you need us…',
    text: 'Help & Contact gives you searchable FAQs and a support form so you can send a request and track its status.',
    cue: 'Questions have a home too.',
  },
]

function TourCharacter() {
  return (
    <div className="new-tour-character" aria-hidden="true">
      <div className="tour-character-spark spark-a">✦</div>
      <div className="tour-character-spark spark-b">✦</div>
      <div className="tour-character-shadow" />
      <div className="tour-character-body">
        <div className="tour-hair" />
        <div className="tour-face"><i /><b /></div>
        <div className="tour-neck" />
        <div className="tour-dress">
          <span />
        </div>
        <div className="tour-arm tour-arm-left" />
        <div className="tour-arm tour-arm-right" />
        <div className="tour-hand tour-hand-left" />
        <div className="tour-hand tour-hand-right" />
      </div>
      <div className="tour-character-tag">ALFIYA</div>
    </div>
  )
}

export default function NewUserTour() {
  const location = useLocation()
  const navigate = useNavigate()
  const [active, setActive] = useState(false)
  const [index, setIndex] = useState(0)

  const current = steps[index]
  const isCorrectPage = location.pathname === current.path

  useEffect(() => {
    if (localStorage.getItem('alfiya_new_user_tour') !== 'pending') return
    const saved = Number(localStorage.getItem('alfiya_new_user_tour_step') || '0')
    setIndex(Number.isFinite(saved) && saved >= 0 && saved < steps.length ? saved : 0)
    setActive(true)
  }, [location.pathname])

  useEffect(() => {
    if (!active || !current) return
    localStorage.setItem('alfiya_new_user_tour_step', String(index))

    if (location.pathname !== current.path) {
      const timer = window.setTimeout(() => navigate(current.path), 180)
      return () => window.clearTimeout(timer)
    }
  }, [active, current, index, location.pathname, navigate])

  useEffect(() => {
    if (!active || !isCorrectPage) return
    const timer = window.setTimeout(() => {
      if (index >= steps.length - 1) {
        finish()
      } else {
        setIndex((value) => value + 1)
      }
    }, 6500)
    return () => window.clearTimeout(timer)
  }, [active, index, isCorrectPage])

  function finish() {
    localStorage.removeItem('alfiya_new_user_tour')
    localStorage.removeItem('alfiya_new_user_tour_step')
    setActive(false)
  }

  function next() {
    if (index >= steps.length - 1) {
      finish()
      return
    }
    setIndex((value) => value + 1)
  }

  function skip() {
    finish()
  }

  const progress = useMemo(() => ((index + 1) / steps.length) * 100, [index])

  if (!active || !current) return null

  return (
    <div className="new-user-tour" role="dialog" aria-modal="true" aria-label="Alfiya app tour">
      <div className="new-tour-vignette" />
      <div className="new-tour-progress">
        <span style={{ width: progress + '%' }} />
      </div>

      <div className="new-tour-stage">
        <TourCharacter />

        <div className="new-tour-bubble">
          <div className="new-tour-bubble-tail" />
          <p className="new-tour-kicker">{current.kicker}</p>
          <h2>{current.title}</h2>
          <p className="new-tour-text">{current.text}</p>
          <div className="new-tour-cue">
            <span>✦</span>
            <strong>{current.cue}</strong>
          </div>
          <div className="new-tour-footer">
            <span>{index + 1} / {steps.length}</span>
            <div>
              <button type="button" className="new-tour-skip" onClick={skip}>Skip tour</button>
              <button type="button" className="new-tour-next" onClick={next}>
                {index === steps.length - 1 ? 'Start exploring' : 'Next'} <b>→</b>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="new-tour-page-cue">
        <span className="new-tour-cue-dot" />
        {isCorrectPage ? 'Showing this part of Alfiya now' : 'Opening the next part…'}
      </div>
    </div>
  )
}
