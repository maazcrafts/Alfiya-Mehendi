import DashboardSidebar from '../../components/DashboardSidebar.jsx'
import LocationPicker from '../../components/LocationPicker.jsx'
import { Link, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'


function BookingCelebrationModal({ onClose, serviceName }) {
  return (
    <div className="booking-celebration-backdrop" role="presentation" onClick={onClose}>
      <div className="booking-celebration-modal" role="dialog" aria-modal="true" aria-labelledby="booking-celebration-title" onClick={event => event.stopPropagation()}>
        <button type="button" className="booking-celebration-close" aria-label="Close" onClick={onClose}>×</button>

        <div className="booking-celebration-character" aria-hidden="true">
          <div className="celebration-spark spark-one">✦</div>
          <div className="celebration-spark spark-two">✦</div>
          <div className="celebration-spark spark-three">·</div>
          <div className="celebration-bubble">
            <span>YOU DID IT!</span>
            <strong>Your request is in.</strong>
          </div>
          <div className="celebration-character-body">
            <div className="celebration-hair"></div>
            <div className="celebration-face"><span></span><i></i></div>
            <div className="celebration-neck"></div>
            <div className="celebration-torso"></div>
            <div className="celebration-arm celebration-arm-left"></div>
            <div className="celebration-arm celebration-arm-right"></div>
            <div className="celebration-hand"></div>
          </div>
          <div className="celebration-ground"></div>
        </div>

        <div className="booking-celebration-copy">
          <p className="dashboard-kicker">Alfiya appointment studio</p>
          <h2 id="booking-celebration-title">You’re officially on the list.</h2>
          <p className="booking-celebration-message">
            Your <strong>{serviceName}</strong> request is sent. ✨
          </p>
          <div className="booking-celebration-note">
            <span className="booking-celebration-check">✓</span>
            <span>We’ll let you know when Alfiya approves it.</span>
          </div>
          <button type="button" className="booking-celebration-action" onClick={onClose}>Okay, got it!</button>
        </div>
      </div>
    </div>
  )
}

function BookingErrorModal({ message, onClose }) {
  if (!message) return null
  return (
    <div className="booking-error-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="booking-error-modal" role="alertdialog" aria-modal="true" aria-labelledby="booking-error-title" onClick={event => event.stopPropagation()}>
        <button type="button" className="booking-error-modal-close" aria-label="Close" onClick={onClose}>×</button>
        <div className="booking-error-modal-icon">!</div>
        <p className="dashboard-kicker">Appointment</p>
        <h2 id="booking-error-title">Please check your selection.</h2>
        <p>{message}</p>
        <button type="button" className="booking-error-modal-action" onClick={onClose}>Okay, got it</button>
      </div>
    </div>
  )
}

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const slots = Array.from({ length: 21 }, (_, i) => {
  const minutes = 600 + i * 30, h = Math.floor(minutes / 60), m = minutes % 60
  return { value: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`, label: `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}` }
})
const statusMeta = {
  requested: ['Pending approval','pending'],
  confirmed: ['Booked successfully','confirmed'],
  rejected: ['Request rejected','rejected'],
  completed: ['Completed','confirmed'],
  cancelled: ['Cancelled','rejected'],
}
function user(){try{return JSON.parse(sessionStorage.getItem('alfiya_user')||'{}')}catch{return {}}}
function token(){return sessionStorage.getItem('alfiya_auth_token')||''}
function today(){
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date())
  const get=t=>parts.find(p=>p.type===t)?.value||''
  return get('year')+'-'+get('month')+'-'+get('day')
}
function dateKey(value){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value||'')) return 0
  const [y,m,d]=value.split('-').map(Number)
  return y*10000+m*100+d
}
function istNowParts() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date())
  const get = type => parts.find(part => part.type === type)?.value || ''
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` }
}
function isFutureAppointment(dateValue,timeValue){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(dateValue||'') || !/^\d{2}:\d{2}$/.test(timeValue||'')) return false
  const now = istNowParts()
  if(dateValue > now.date) return true
  if(dateValue < now.date) return false
  return timeValue > now.time
}
function price(p){return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format((p||0)/100)}
function dateLabel(v){return v?new Intl.DateTimeFormat('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(v+'T00:00:00')):''}
function timeLabel(v){if(!v)return '';const [h,m]=v.slice(0,5).split(':').map(Number);return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`}
function readApiResponse(response){
  return response.json().catch(() => ({ message: response.statusText || 'Unable to read server response.' }))
}

export default function Booking(){
  const [params]=useSearchParams(), serviceSlug=params.get('service')||''
  const u=useMemo(user,[]), first=u?.name?.split(' ')?.[0]||'there', logged=Boolean(token())
  const [service,setService]=useState(null),[bookings,setBookings]=useState([]),[booked,setBooked]=useState([])
  const [date,setDate]=useState(''),[time,setTime]=useState(''),[note,setNote]=useState('')
  const [customerName,setCustomerName]=useState(u?.name||'')
  const [customerPhone,setCustomerPhone]=useState('')
  const [customerLocation,setCustomerLocation]=useState('')
  const [customerLatitude,setCustomerLatitude]=useState(null)
  const [customerLongitude,setCustomerLongitude]=useState(null)
  const [step,setStep]=useState(1),[loading,setLoading]=useState(Boolean(serviceSlug)),[loadingSlots,setLoadingSlots]=useState(false)
  const [busy,setBusy]=useState(false),[cancelling,setCancelling]=useState(''),[error,setError]=useState(''),[success,setSuccess]=useState(false),[showCelebration,setShowCelebration]=useState(false)

  async function loadBookings(){
    if(!logged)return
    try{const r=await fetch(apiBase+'/api/bookings/mine',{headers:{Authorization:'Bearer '+token()}});const d=await readApiResponse(r);if(!r.ok)throw Error(d.message);setBookings(d.bookings||[])}
    catch(e){setError(e.message||'Unable to load bookings.')}
  }
  useEffect(()=>{if(!serviceSlug){setLoading(false);return} fetch(apiBase+'/api/services/'+encodeURIComponent(serviceSlug)).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.message);setService(d.service)}).catch(e=>setError(e.message)).finally(()=>setLoading(false))},[serviceSlug])
  useEffect(()=>{loadBookings()},[])
  useEffect(()=>{
    if(!logged || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setBooked([])
      setLoadingSlots(false)
      return
    }
    setLoadingSlots(true)
    fetch(apiBase+'/api/bookings/availability?date='+encodeURIComponent(date),{headers:{Authorization:'Bearer '+token()}})
      .then(async r=>{const d=await readApiResponse(r);if(!r.ok)throw Error(d.message);setBooked(d.bookedSlots||[])})
      .catch(e=>setError(e.message))
      .finally(()=>setLoadingSlots(false))
  },[date,logged])
  const available=slots.filter(s=>!booked.includes(s.value))
  const todayValue=today()
  const todayKey=dateKey(todayValue)
  const canNext=step===1?dateKey(date)>=todayKey:step===2?Boolean(time)&&slots.some(s=>s.value===time)&&!booked.includes(time):true
  const continueStep=()=>{
    setError('')
    if(step===1){
      if(!date||dateKey(date)<todayKey){setError('Please choose today or a future appointment date.');return}
      setStep(2);return
    }
    if(step===2){
      if(!date || dateKey(date) < todayKey){setError('That appointment date is no longer available. Please choose another date.');setStep(1);return}
      if(!time||!slots.some(s=>s.value===time)||booked.includes(time)){setError('Please choose an available time slot.');return}
      if(!isFutureAppointment(date,time)){setError('That time has already passed. Please choose a later slot.');return}
      setStep(3)
    }
  }
  const cancelBooking=async bookingId=>{
    if(!window.confirm('Cancel this pending appointment request?')) return
    setCancelling(bookingId)
    setError('')
    try{
      const r=await fetch(apiBase+'/api/bookings/'+bookingId+'/cancel',{
        method:'PATCH',
        headers:{Authorization:'Bearer '+token()}
      })
      const d=await readApiResponse(r)
      if(!r.ok) throw Error(d.message)
      await loadBookings()
    }catch(e){setError(e.message||'Unable to cancel this booking.')}
    finally{setCancelling('')}
  }

  const submit=async e=>{
    e.preventDefault()
    setError('')
    if(!logged){setError('Please log in before booking.');return}
    if(!date || dateKey(date)<todayKey){setError('Please choose today or a future appointment date.');setStep(1);return}
    if(!time||!slots.some(s=>s.value===time)||booked.includes(time)){setError('Please choose an available time slot.');setStep(2);return}
    if(!isFutureAppointment(date,time)){setError('That time has already passed. Please choose a later slot.');setStep(2);return}
    if(!customerName.trim() || customerName.trim().length<2){setError('Please enter your full name.');return}
    if(!/^(?:\+91[-\s]?)?[6-9]\d{9}$/.test(customerPhone.trim().replace(/[()]/g,''))){setError('Please enter a valid Indian mobile number.');return}
    if(!customerLocation.trim() || !Number.isFinite(Number(customerLatitude)) || !Number.isFinite(Number(customerLongitude))){setError('Please choose the appointment location on the map.');return}
    setBusy(true)
    try{
      const r=await fetch(apiBase+'/api/bookings',{
        method:'POST',
        headers:{'Content-Type':'application/json',Authorization:'Bearer '+token()},
        body:JSON.stringify({
          serviceSlug,
          bookingDate:date,
          bookingTime:time,
          customerName:customerName.trim(),
          customerPhone:customerPhone.trim(),
          customerLocation:customerLocation.trim(),
          customerLatitude:Number(customerLatitude),
          customerLongitude:Number(customerLongitude),
          customerNote:note
        })
      })
      const d=await readApiResponse(r)
      if(!r.ok)throw Error(d.message)
      setSuccess(true);setShowCelebration(true);await loadBookings()
    }catch(e){setError(e.message||'Unable to send booking request.')}finally{setBusy(false)}
  }

  return <>
    <BookingErrorModal message={error} onClose={() => setError('')} />
    {success&&showCelebration&&<BookingCelebrationModal serviceName={service?.name||'mehendi service'} onClose={()=>setShowCelebration(false)} />}
    <main className="shop-dashboard booking-dashboard">
    <DashboardSidebar active="bookings" />
    <section className="dashboard-main"><header className="dashboard-topbar"><div><p className="dashboard-kicker">Alfiya appointment studio</p><h1>{success?'Request received.':serviceSlug?'Build your appointment.':'My bookings.'}</h1></div><Link to="/services" className="services-shop-link">{serviceSlug?'Back to services':'Book an appointment'}</Link></header>
    <div className="dashboard-content booking-content">
      {!logged&&<div className="booking-login-card"><p className="dashboard-kicker">Account required</p><h2>Log in to book.</h2><p>Your appointment stays connected to your account so you can follow every decision.</p><Link to="/login" className="service-book-button">Log in</Link></div>}
      {error&&<div className="booking-alert booking-alert-error">{error}</div>}
      {loading&&<div className="services-state">Preparing your appointment…</div>}
      {!loading&&logged&&!service&&serviceSlug&&<div className="booking-empty-state"><h2>We couldn't load that service.</h2><Link to="/services" className="service-book-button">Choose another service</Link></div>}
      {logged&&service&&serviceSlug&&!success&&<form onSubmit={submit}>
        <section className="booking-shell">
          <div className="booking-service-strip">
            <div>
              <span className="booking-breadcrumb">MEHENDI SERVICES <b>/</b> APPOINTMENT</span>
              <h2>{service.name}</h2>
              <details className="booking-service-details">
                <summary>View service details</summary>
                <p>{service.description}</p>
              </details>
            </div>
            <div className="booking-price"><small>Service price</small><strong>{price(service.price_paise)}</strong></div>
          </div>

          <div className="booking-journey">
            <div className="booking-journey-heading">
              <div>
                <span className="dashboard-kicker">Your appointment</span>
                <h3>{step===1?'Choose a date':step===2?'Choose a time':'Review your details'}</h3>
              </div>
              <span className="booking-count">Step {step} of 3</span>
            </div>
            <div className="booking-progress" aria-label="Appointment steps">
              {[1,2,3].map(n=>{
                const done=step>n, current=step===n, locked=n>step;
                const label=n===1?'Date':n===2?'Time':'Review';
                const hint=n===1?'Pick your day':n===2?'Select a slot':'Confirm details';
                return <button type="button" key={n} className={current?'current':done?'done':'upcoming'} disabled={locked} onClick={()=>done&&setStep(n)} aria-current={current?'step':undefined}>
                  <b>{done?'✓':('0'+n)}</b>
                  <span><strong>{label}</strong><small>{current?'Current step':done?'Completed':hint}</small></span>
                </button>
              })}
            </div>
            <div className="booking-next-hint">
              <span className="booking-step-dot"></span>
              <span><strong>{step===1?'First, choose the day of your appointment.':step===2?'Now choose an available time.':'Everything looks right? Send your request.'}</strong></span>
              <span className="booking-next-arrow">→</span>
              <span>{step===1?'Then: Time':step===2?'Then: Review':'Then: Await approval'}</span>
            </div>
          </div>

          <section className="booking-wizard-card">
            {step===1&&<div>
              <span className="booking-section-number">01</span>
              <h2>When should we see you?</h2>
              <p className="booking-help">Choose the day that works for you. You can change it later before sending the request.</p>
              <label className="booking-field booking-date-field"><span>Appointment date</span><input type="date" min={todayValue} value={date} onChange={e=>{
  const value=e.target.value
  setError('')
  setDate(value)
  setTime('')
}} required/></label>
              {date&&<div className="booking-selected-banner"><div><small>Selected date</small><strong>{dateLabel(date)}</strong></div><span>✓ Date selected</span></div>}
            </div>}

            {step===2&&<div>
              <span className="booking-section-number">02</span>
              <h2>What time works for you?</h2>
              <p className="booking-help">Only confirmed appointments are marked as booked. Select any available slot below.</p>
              {loadingSlots?<div className="services-state">Checking availability…</div>:<div className="booking-time-grid upgraded">{slots.map(s=><button type="button" key={s.value} disabled={booked.includes(s.value)} className={time===s.value?'selected':''} onClick={()=>setTime(s.value)}><strong>{s.label}</strong><small>{booked.includes(s.value)?'Booked':time===s.value?'Selected':'Available'}</small></button>)}</div>}
            </div>}

            {step===3&&<div>
              <span className="booking-section-number">03</span>
              <h2>Check everything before you send.</h2>
              <p className="booking-help">Review your appointment details. Your request will be sent to Alfiya for approval.</p>
              <div className="booking-review">
                <div><small>Service</small><strong>{service.name}</strong></div>
                <div><small>Date</small><strong>{dateLabel(date)}</strong></div>
                <div><small>Time</small><strong>{timeLabel(time)}</strong></div>
                <div><small>Price</small><strong>{price(service.price_paise)}</strong></div>
                <div className="booking-review-location"><small>Visit location</small><strong>{customerLocation || 'Not selected'}</strong></div>
              </div>

              <div className="booking-contact-card">
                <div className="booking-contact-heading">
                  <div>
                    <span className="booking-section-number">04</span>
                    <h3>How can we reach you?</h3>
                  </div>
                  <span>Required for appointment</span>
                </div>
                <p className="booking-help">We’ll use these details to coordinate your appointment. Your account Gmail is used automatically.</p>
                <div className="booking-contact-grid">
                  <label className="booking-field">
                    <span>Full name</span>
                    <input value={customerName} onChange={e=>setCustomerName(e.target.value)} maxLength={120} placeholder="Your full name" autoComplete="name" required />
                  </label>
                  <label className="booking-field">
                    <span>Mobile number</span>
                    <input value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)} maxLength={15} placeholder="+91 98765 43210" inputMode="tel" autoComplete="tel" required />
                  </label>
                  <label className="booking-field booking-contact-wide">
                    <span>Gmail / account email</span>
                    <input value={u?.email||''} readOnly aria-readonly="true" />
                    <small className="booking-field-note">This is the email connected to your Alfiya account.</small>
                  </label>
                  <div className="booking-contact-wide">
                    <LocationPicker
                      value={customerLocation}
                      latitude={customerLatitude}
                      longitude={customerLongitude}
                      onChange={({ address, latitude, longitude }) => {
                        setCustomerLocation(address || '')
                        setCustomerLatitude(latitude)
                        setCustomerLongitude(longitude)
                        setError('')
                      }}
                    />
                  </div>
                </div>
              </div>

              <label className="booking-field"><span>Message to Alfiya <small>(optional)</small></span><textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={500} placeholder="Anything we should know about your appointment?"/></label>
              <div className="booking-confirm-note"><strong>What happens next?</strong><span>We send your request → Alfiya receives your contact details → Alfiya reviews it → You receive the final status in your bookings.</span></div>
            </div>}

            <div className="booking-wizard-actions">
              {step>1?<button type="button" className="booking-back" onClick={()=>setStep(step-1)}>← Back</button>:<span/>}
              {step<3?<button type="button" className="booking-submit" disabled={step===2?( !canNext || loadingSlots ):false} onClick={continueStep}>Continue to {step===1?'time':'review'} <span>→</span></button>:<button className="booking-submit" disabled={busy}>{busy?'Sending request…':'Send appointment request →'}</button>}
            </div>
            {step===3&&<p className="booking-disclaimer">Your appointment is not confirmed until Alfiya approves the request.</p>}
          </section>
        </section>
      </form>}
      {logged&&success&&<section className="booking-success-panel"><div className="booking-success-mark">✓</div><p className="dashboard-kicker">Request sent</p><h2>Your appointment is now pending.</h2><p>Alfiya Mehendi has received your request for <strong>{dateLabel(date)}</strong> at <strong>{timeLabel(time)}</strong>. You will see the final decision in your booking history.</p><div><Link to="/booking" className="service-book-button">View my bookings</Link><Link to="/services" className="services-shop-link">Browse other services</Link></div></section>}
      {logged&&!serviceSlug&&bookings.length===0&&<section className="booking-no-bookings">
        <div className="booking-no-bookings-mark" aria-hidden="true"><span>+</span></div>
        <p className="dashboard-kicker">Your appointment space</p>
        <h2>Nothing booked yet.</h2>
        <p>You don't have any appointments in your booking history. When you're ready, choose a mehendi service and pick a date and time that works for you.</p>
        <Link to="/services" className="booking-primary-cta">Book an appointment <span>→</span></Link>
      </section>}

      {logged&&<section className={`booking-history-section ${!serviceSlug&&bookings.length===0?'booking-history-empty':''}`}>
        <div className="booking-section-heading"><div><p className="dashboard-kicker">Your timeline</p><h2>Booking history</h2></div><span>{bookings.length} {bookings.length===1?'request':'requests'}</span></div>
        {bookings.length>0?<div className="booking-list">{bookings.map(b=>{const m=statusMeta[b.status]||statusMeta.requested;return <article className="booking-history-card" key={b.id}><div className="booking-history-main"><div><p className="dashboard-kicker">{b.level}</p><h3>{b.service_name}</h3></div><span className={'booking-status booking-status-'+m[1]}>{m[0]}</span></div><div className="booking-history-details"><span><b>Date</b>{dateLabel(String(b.booking_date).slice(0,10))}</span><span><b>Time</b>{timeLabel(b.booking_time)}</span><span><b>Price</b>{price(b.price_paise)}</span></div>{b.status==='requested'&&<p className="booking-status-note">Waiting for admin approval. Your slot is not confirmed yet.</p>}{b.status==='confirmed'&&<p className="booking-status-note success">Confirmed. Your appointment is booked.</p>}{b.status==='rejected'&&<p className="booking-status-note rejected">Rejected{b.admin_note?': '+b.admin_note:'.'} Choose another slot to try again.</p>}{b.status==='cancelled'&&<p className="booking-status-note rejected">You cancelled this appointment request before it was approved.</p>}{b.status==='requested'&&<div className="booking-history-actions"><button type="button" className="booking-cancel-button" disabled={cancelling===b.id} onClick={()=>cancelBooking(b.id)}>{cancelling===b.id?'Cancelling…':'Cancel request'}</button><span>This only cancels a pending request.</span></div>}</article>})}</div>:<div className="booking-empty-state compact"><h3>No booking requests yet.</h3><p>Your appointment timeline will appear here after you submit your first request.</p></div>}
      </section>}
    </div></section>
  </main>
  </>
}