# Alfiya Mehendi — System Architecture

## 1. System Goal

Alfiya Mehendi combines two business flows in one application:

1. Product commerce — mehendi powders, oils, tools, cone/cellophane supplies and related products.
2. Mehendi services — customers can browse service packages and request a date/time for an appointment.

The architecture keeps these domains separate while sharing authentication, customer accounts and payment infrastructure.

## 2. High-Level Architecture

```
Customer Browser
      |
      v
React + Vite Frontend
      |
      | HTTPS / JSON REST API
      v
Express API
      |
      +-------------------+--------------------+-------------------+
      |                   |                    |                   |
      v                   v                    v                   v
Authentication       Product Catalog       Commerce          Services/Bookings
      |                   |                    |                   |
      +-------------------+--------------------+-------------------+
                              |
                              v
                         PostgreSQL
                              |
               +--------------+--------------+
               |              |              |
               v              v              v
          Payment API     Email Service   Image/Object Storage

Admin Dashboard
      |
      v
Same Express API
      |
      v
PostgreSQL
```

## 3. Frontend Modules

- Authentication: login, signup, Google sign-in, session handling.
- Home: brand introduction, featured products and services.
- Shop: categories, filters, product listing.
- Product Details: variants, stock, quantity and cart actions.
- Cart: selected products and quantities.
- Checkout: address, order summary and payment.
- Services: service packages and pricing.
- Booking: date/time request, customer details and booking status.
- Account: profile, addresses, orders and bookings.
- Admin: products, inventory, orders, services and bookings.

## 4. Backend Modules

```
backend/src/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
└── server.js
```

Planned API domains:

- /api/auth
- /api/users
- /api/products
- /api/categories
- /api/cart
- /api/orders
- /api/payments
- /api/services
- /api/bookings
- /api/admin

## 5. Authentication

Current authentication already supports Google sign-in and JWT-based sessions.

The production model should use:

- users table as the central identity record
- password authentication for email/password accounts
- Google identity linked through google_id
- short-lived access tokens when the auth layer is hardened for production
- role-based access for customer/admin routes

No phone/OTP authentication is part of this architecture.

## 6. Commerce Flow

```
Browse Products
      |
      v
Product Details
      |
      v
Add to Cart
      |
      v
Cart
      |
      v
Checkout
      |
      v
Payment
      |
      v
Order Created
      |
      v
Order Processing
      |
      v
Delivered / Cancelled / Refunded
```

Order item prices are stored as snapshots so later product-price changes do not alter historical orders.

## 7. Service Booking Flow

```
Browse Services
      |
      v
Choose Service
      |
      v
Choose Date / Time
      |
      v
Booking Request
      |
      v
Admin Confirmation
      |
      v
Confirmed
      |
      +----> Completed
      |
      +----> Cancelled
```

Bookings are separate from product orders because their lifecycle, availability and fulfilment rules are different.

## 8. Roles

### Customer
- Manage own account
- Browse products
- Manage cart
- Place orders
- View own orders
- Request bookings
- View own bookings

### Admin
- Manage products
- Manage categories
- Manage stock
- Manage orders
- Manage services
- Confirm/cancel bookings
- View customers

The backend must enforce these permissions; hiding admin UI is not sufficient.

## 9. Storage

PostgreSQL stores structured business data.

Product/service images should be stored in object storage, with only their URLs/keys stored in PostgreSQL.

Secrets belong in environment variables and must never be committed to Git.

## 10. Important Design Decisions

- Product commerce and service bookings are separate domains.
- Orders contain immutable item-price snapshots.
- Bookings have their own status and scheduling fields.
- Inventory belongs to products, not orders.
- Authentication is shared by all customer features.
- Admin permissions are enforced server-side.
- Payments are represented independently so the payment provider can change later.
