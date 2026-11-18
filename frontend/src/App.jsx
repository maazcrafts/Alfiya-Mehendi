import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import Login from './pages/auth/Login.jsx'
import Signup from './pages/auth/Signup.jsx'
import Terms from './pages/legal/Terms.jsx'
import Privacy from './pages/legal/Privacy.jsx'
import ForgotPassword from './pages/auth/ForgotPassword.jsx'
import ResetPassword from './pages/auth/ResetPassword.jsx'
import Products from './pages/products/Products.jsx'
import ProductDetails from './pages/products/ProductDetails.jsx'
import Services from './pages/services/Services.jsx'
import Booking from './pages/booking/Booking.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminBookings from './pages/admin/AdminBookings.jsx'
import AdminOrders from './pages/admin/AdminOrders.jsx'
import AdminSupport from './pages/admin/AdminSupport.jsx'
import Orders from './pages/orders/Orders.jsx'
import Cart from './pages/cart/Cart.jsx'
import Contact from './pages/contact/Contact.jsx'
import Account from './pages/account/Account.jsx'
import Checkout from './pages/checkout/Checkout.jsx'
import GettingThere from './pages/booking/GettingThere.jsx'
import './styles/getting-there.css'
import NetworkStatus from './components/NetworkStatus.jsx'
import NewUserTour from './components/NewUserTour.jsx'

function Placeholder({ title }) {
  return <main style={{ padding: '3rem' }}><h1>{title}</h1><p>Page scaffold ready for implementation.</p></main>
}

function RootRedirect() {
  const token = sessionStorage.getItem('alfiya_auth_token')
  const returnTo = sessionStorage.getItem('alfiya_return_to') || '/services'
  return <Navigate to={token ? returnTo : '/signup'} replace />
}

// Clear invalid session on app start
useEffect(() => {
  const token = sessionStorage.getItem('alfiya_auth_token')
  if (!token) return
  ;(async () => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const response = await fetch(apiBase + '/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (!response.ok || data.message?.includes('authentication required') || data.message?.includes('invalid or expired')) {
        sessionStorage.removeItem('alfiya_auth_token')
        sessionStorage.removeItem('alfiya_user')
        sessionStorage.removeItem('alfiya_return_to')
      }
    } catch {
      sessionStorage.removeItem('alfiya_auth_token')
      sessionStorage.removeItem('alfiya_user')
      sessionStorage.removeItem('alfiya_return_to')
    }
  })()
}, [])

export default function App() {
  return (
    <BrowserRouter>
      <NetworkStatus />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<RootRedirect />} />

        {/* Public routes - no auth required }}
        <Route path="/products" element={<Products />} />
        <Route path="/products/:slug" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/services" element={<Services />} />
        <Route path="/booking" element={<Booking />} />
          <Route path="/booking/getting-there" element={<GettingThere />} />

        {/* Admin routes - auth checked inside AdminDashboard component }}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/bookings" element={<AdminBookings />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/support" element={<AdminSupport />} />

        {/* Customer/account routes */}
        <Route path="/account" element={<Account />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/about" element={<Placeholder title="About" />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
      <NewUserTour />
    </BrowserRouter>
  )
}