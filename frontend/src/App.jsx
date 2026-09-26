import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/auth/Login.jsx'
import Signup from './pages/auth/Signup.jsx'

function Placeholder({ title }) {
  return <main style={{ padding: '3rem' }}><h1>{title}</h1><p>Page scaffold ready for implementation.</p></main>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<Placeholder title="Alfiya Mehendi" />} />
        <Route path="/products" element={<Placeholder title="Products" />} />
        <Route path="/products/:slug" element={<Placeholder title="Product Details" />} />
        <Route path="/cart" element={<Placeholder title="Cart" />} />
        <Route path="/checkout" element={<Placeholder title="Checkout" />} />
        <Route path="/services" element={<Placeholder title="Mehendi Services" />} />
        <Route path="/booking" element={<Placeholder title="Booking" />} />
        <Route path="/account" element={<Placeholder title="My Account" />} />
        <Route path="/orders" element={<Placeholder title="Orders & Bookings" />} />
        <Route path="/about" element={<Placeholder title="About" />} />
        <Route path="/contact" element={<Placeholder title="Contact" />} />
      </Routes>
    </BrowserRouter>
  )
}
