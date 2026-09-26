import { BrowserRouter, Routes, Route } from 'react-router-dom'
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
import AdminBookings from './pages/admin/AdminBookings.jsx'
import AdminOrders from './pages/admin/AdminOrders.jsx'
import Orders from './pages/orders/Orders.jsx'

function Placeholder({ title }) {
  return <main style={{ padding: '3rem' }}><h1>{title}</h1><p>Page scaffold ready for implementation.</p></main>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<Placeholder title="Alfiya Mehendi" />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:slug" element={<ProductDetails />} />
        <Route path="/cart" element={<Placeholder title="Cart" />} />
        <Route path="/checkout" element={<Placeholder title="Checkout" />} />
        <Route path="/services" element={<Services />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/admin/bookings" element={<AdminBookings />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/account" element={<Placeholder title="My Account" />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/about" element={<Placeholder title="About" />} />
        <Route path="/contact" element={<Placeholder title="Contact" />} />
      </Routes>
    </BrowserRouter>
  )
}
