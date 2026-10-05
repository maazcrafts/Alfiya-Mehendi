# ✦ ALFIYA MEHENDI

<p align="center">
  <img src="frontend/public/alfiya-logo.svg" alt="Alfiya Mehendi" width="140" />
</p>

<h3 align="center">A full-stack digital platform for mehendi services, appointments, customers & commerce.</h3>

<p align="center">
  <strong>Traditional craft. Modern booking experience.</strong>
</p>

<p align="center">
  <a href="https://frontend-pi-one-14.vercel.app"><img src="https://img.shields.io/badge/Live%20App-Vercel-black?style=for-the-badge&logo=vercel" alt="Live App" /></a>
  <a href="https://github.com/maazcrafts/Alfiya-Mehendi"><img src="https://img.shields.io/badge/Source-GitHub-181717?style=for-the-badge&logo=github" alt="GitHub" /></a>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=111" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=fff" alt="Vite 7" />
  <img src="https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js&logoColor=fff" alt="Node.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql&logoColor=fff" alt="PostgreSQL" />
</p>

<p align="center">
  <a href="https://frontend-pi-one-14.vercel.app">Open the live application →</a>
</p>

---

## ◇ The idea

**Alfiya Mehendi** is a production-oriented full-stack web application designed around the actual workflow of a mehendi business.

Instead of treating the business as a simple brochure website, the platform brings the customer journey and business operations into one system:

**Discover → Choose a service → Check availability → Book → Manage → Fulfil**

It also provides the foundation for a product catalogue, cart, orders and future commerce workflows.

> **The goal:** make booking a mehendi appointment feel as straightforward as booking any modern digital service.

---

## ✦ What the platform does

### For customers

| Area | Experience |
|---|---|
| **Authentication** | Email/password signup & login + Google authentication |
| **Services** | Browse mehendi services, pricing and service levels |
| **Appointments** | Select date, check availability and request a booking |
| **Booking details** | Capture name, phone, appointment address, map pin, account email and optional message |
| **Booking history** | View personal booking activity and statuses |
| **Products** | Browse mehendi products and product details |
| **Cart** | Add products, change quantities and remove items |
| **Orders** | Access customer order history |
| **Account** | Manage profile information and account-related actions |
| **Support** | Search help/FAQ content and submit support requests |
| **Network UX** | Clear online/offline and connection-state feedback |

### Appointment location selection

Customers can search for an address, use their device location, or select/drag a pin on an OpenStreetMap-powered map. The selected address and coordinates are stored with the booking so the admin can plan the visit.

The public Photon geocoder is used for address search and reverse geocoding. It requires no API key and is intended for fair, moderate usage; its public demo can be throttled or changed without notice. urlPhoton project and usage noteshttps://github.com/komoot/photon

### For the business

The admin workspace turns the application into an operational tool rather than only a customer-facing website.

- 📊 Dashboard and operational overview
- 📅 Appointment management
- 👤 Customer information
- 🛍️ Product catalogue management
- ✂️ Service catalogue management
- 📦 Order management
- 🆘 Support request management
- 💰 Revenue/order visibility
- 🔐 Backend-enforced administrator authorization
- 🔄 Booking status lifecycle management

---

## ◈ Booking workflow

The core workflow is deliberately simple:

```text
CUSTOMER
   │
   ▼
SIGN UP / LOGIN
   │
   ▼
BROWSE SERVICES
   │
   ▼
SELECT SERVICE
   │
   ▼
SELECT DATE
   │
   ▼
CHECK AVAILABLE TIME
   │
   ▼
SELECT VISIT LOCATION
   │
   ▼
ENTER CONTACT DETAILS
   │
   ▼
SUBMIT BOOKING
   │
   ▼
ADMIN REVIEW
   │
   ├── Confirm
   ├── Reject
   ├── Complete
   └── Cancel
```

The booking system also protects appointment-slot conflicts on the backend/database side rather than trusting the browser.

---

## 🧭 Application map

```text
ALFIYA MEHENDI
│
├── CUSTOMER
│   ├── Authentication
│   │   ├── Signup
│   │   ├── Login
│   │   ├── Google Auth
│   │   ├── Forgot Password
│   │   └── Reset Password
│   │
│   ├── Services
│   │   ├── Service catalogue
│   │   ├── Availability
│   │   └── Booking
│   │
│   ├── Shop
│   │   ├── Products
│   │   ├── Product details
│   │   ├── Cart
│   │   └── Orders
│   │
│   ├── Account
│   ├── Support
│   └── Contact
│
└── ADMIN
    ├── Dashboard
    ├── Bookings
    ├── Orders
    ├── Products
    ├── Services
    ├── Customers
    └── Support
```

---

## 🏗️ Architecture

```text
                         ┌──────────────────────┐
                         │    CUSTOMER / ADMIN   │
                         │       BROWSER         │
                         └──────────┬───────────┘
                                    │
                              HTTPS / JSON
                                    │
                                    ▼
                    ┌──────────────────────────────┐
                    │      REACT + VITE APP        │
                    │                              │
                    │  React 19                    │
                    │  React Router                │
                    │  Custom CSS / SVG            │
                    └──────────────┬───────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │       EXPRESS REST API       │
                    │                              │
                    │ Auth · Users · Services      │
                    │ Products · Cart · Orders     │
                    │ Bookings · Support · Admin   │
                    │ Addresses · Payments         │
                    └──────────────┬───────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │          PostgreSQL          │
                    │                              │
                    │ Users · Products · Services  │
                    │ Bookings · Orders · Cart     │
                    │ Support · Addresses · etc.   │
                    └──────────────────────────────┘

             Frontend: Vercel       Backend: Render
```

Detailed architecture documentation:

**[docs/system-architecture.md](docs/system-architecture.md)**

---

## ⚙️ Technology stack

| Layer | Technology |
|---|---|
| Frontend | React 19 |
| Build tool | Vite 7 |
| Routing | React Router 7 |
| Backend | Node.js + Express 5 |
| Database | PostgreSQL |
| Database driver | node-postgres |
| Authentication | JWT + Google Identity |
| Password hashing | Node.js crypto / scrypt |
| API | REST + JSON |
| Styling | Custom CSS + SVG |
| Frontend deployment | Vercel |
| Backend deployment | Render |
| Database hosting | PostgreSQL / Supabase-compatible connection |
| Version control | Git + GitHub |

---

## 🔐 Authentication & security

Security-sensitive rules are handled server-side.

### Authentication

- Email/password authentication
- Google Identity authentication
- JWT-based sessions
- Password hashing with scrypt
- Password reset flow
- Authenticated API access

### Authorization

Administrator access is not granted simply because a browser says the user is an admin.

The backend validates the authenticated account against the configured administrator identity and enforces admin-only routes server-side.

### Data protection principles

- Secrets are loaded through environment variables.
- Database credentials are never intended for frontend code.
- Customer data is scoped to authenticated users.
- Booking conflicts are validated server-side.
- Order/product history is designed to preserve historical values.
- Business rules are kept in the API/database layer rather than trusted to the browser.

---

## 🗃️ Core data model

```text
users
 │
 ├── addresses
 ├── carts ───────── cart_items
 ├── orders ──────── order_items
 ├── bookings
 └── support_requests

products ─────────── categories
        └─────────── product_images

services ─────────── bookings

payments ─────────── orders / bookings

password_reset_tokens ── users
```

### Important design decisions

**Money is stored as integer paise.**

This avoids floating-point problems when handling monetary values.

**Historical order information is preserved.**

An old order should retain the product name and price that existed when the order was created.

**Bookings and orders are separate domains.**

A mehendi appointment is not treated as a product order.

**The server owns critical business rules.**

Availability, authorization, stock-related operations and order calculations should not depend on values supplied blindly by the browser.

---

## ✨ Service catalogue

The application supports multiple service levels, including:

- Basic
- Intermediate
- Advanced
- Bridal

Example services include:

- Arabic palm mehendi
- Arm-length mehendi
- Five-finger hand mehendi
- Full-length mehendi
- Bridal mehendi

Pricing is catalogue data and can be changed without redesigning the application.

---

## 🎨 Design system

Alfiya uses a warm editorial visual language rather than a generic SaaS dashboard aesthetic.

**Ivory · Sand · Terracotta · Deep Brown · Sage**

```text
#fffaf2  → Ivory
#eee3d2  → Sand
#a05e3e  → Terracotta
#3c2920  → Deep Brown
#6e7b5d  → Sage
#d9e1ce  → Soft Sage
#dfc29f  → Warm Sand
```

### Design principles

- Clear hierarchy
- Large, readable interfaces
- Strong service presentation
- Restrained motion
- Useful feedback states
- Mobile-conscious layouts
- Visual identity connected to mehendi rather than generic technology branding

> **Traditional craft, presented through a modern interface.**

---

## 📁 Repository structure

```text
Alfiya-Mehendi/
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       │   ├── account/
│       │   ├── admin/
│       │   ├── auth/
│       │   ├── booking/
│       │   ├── cart/
│       │   ├── checkout/
│       │   ├── contact/
│       │   ├── legal/
│       │   ├── orders/
│       │   ├── products/
│       │   └── services/
│       └── styles/
│
├── backend/
│   ├── database/
│   └── src/
│       ├── config/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       └── services/
│
├── docs/
│   └── system-architecture.md
│
└── README.md
```

---

## 🚀 Run locally

### 1. Clone

```bash
git clone https://github.com/maazcrafts/Alfiya-Mehendi.git
cd Alfiya-Mehendi
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

### 3. Install backend dependencies

```bash
cd ../backend
npm install
```

### 4. Configure environment variables

Create:

```text
backend/.env
```

Use the repository's environment example as the starting point.

Typical backend configuration:

```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_client_id
ADMIN_EMAIL=your_admin_email
NODE_ENV=development
```

Frontend:

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

**Never commit real credentials or secrets.**

### 5. Start the backend

```bash
cd backend
npm run dev
```

API:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

### 6. Start the frontend

Open another terminal:

```bash
cd frontend
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## 🌐 Deployment

The current deployment architecture is:

```text
GitHub
  │
  ├──────────────► Vercel
  │                 │
  │                 └── React / Vite frontend
  │
  └──────────────► Render
                    │
                    └── Node / Express API
                             │
                             ▼
                         PostgreSQL
```

### Live application

**[Open Alfiya Mehendi →](https://frontend-pi-one-14.vercel.app)**

### API

```text
https://alfiya-mehendi-api.onrender.com
```

The production frontend communicates with the deployed API through `VITE_API_URL`.

---

## 🧪 Engineering focus

This project is intentionally more than a UI exercise.

The implementation focuses on:

- Real API boundaries
- Persistent PostgreSQL data
- Authentication
- Authorization
- Booking availability
- Booking lifecycle management
- Customer/admin separation
- Session isolation between browser tabs
- RESTful route organization
- Production deployment
- Environment-based configuration
- Database-backed business rules
- Operational admin tooling

---

## 🛣️ Project roadmap

### Core platform

- [x] React + Vite frontend
- [x] Express backend
- [x] PostgreSQL database
- [x] JWT authentication
- [x] Google authentication
- [x] Password reset flow
- [x] Customer accounts
- [x] Service catalogue
- [x] Appointment availability
- [x] Customer booking flow
- [x] Booking history
- [x] Admin booking workspace
- [x] Booking status lifecycle
- [x] Product catalogue foundation
- [x] Cart foundation
- [x] Customer order history
- [x] Admin order management
- [x] Customer management
- [x] Support workflow
- [x] Production frontend deployment
- [x] Production backend deployment

### Deferred after the appointment release

- [x] OpenStreetMap appointment location selection
- [ ] Product catalogue expansion
- [ ] Product imagery
- [ ] Expanded product-shopping experience
- [ ] Complete checkout/payment workflow
- [ ] Push notifications
- [ ] Android customer app
- [ ] Android admin app
- [ ] Further commerce automation
- [ ] Production email delivery
- [ ] Additional business analytics

---

## 📌 Current status

**Core mehendi service and appointment platform: ready for final QA and client handoff.**

The main customer-to-admin booking workflow is implemented, including authentication, service discovery, availability, customer contact capture, appointment location selection, booking submission and administrative booking management.

The product/shop area is intentionally presented as a coming-soon experience for the current release. Product expansion, checkout/payment completion and Android apps are deferred to the next phase.

Final handoff and QA guidance is documented in **[docs/client-handoff.md](docs/client-handoff.md)**.

---

## 💡 Why this project exists

A local service business should not need to choose between:

```text
"Just make me a website."
        ↓
or
"Build me a giant enterprise platform."
```

Alfiya sits in the middle.

It provides the pieces that actually matter to a service business:

```text
CUSTOMER EXPERIENCE
        +
BOOKING OPERATIONS
        +
BUSINESS MANAGEMENT
        =
ONE DIGITAL WORKSPACE
```

---

## 📝 Documentation maintenance

The README is kept aligned with the repository's current architecture, setup flow and deployment structure.

---

## 👨‍💻 Built by

**Maaz Khan**

Diploma in Computer Engineering  
Full-stack development · Backend systems · Database design · AI/ML

GitHub: **[maazcrafts](https://github.com/maazcrafts)**

---

<p align="center">
  <strong>✦ ALFIYA MEHENDI</strong>
  <br />
  <sub>Traditional craft. Modern digital experience.</sub>
</p>

<!-- maintenance-01: Refresh README maintenance marker -->
<!-- maintenance-02: Update README documentation metadata -->
<!-- maintenance-03: Refresh project documentation reference -->
<!-- maintenance-04: Update README maintenance note -->
<!-- maintenance-05: Refresh documentation structure marker -->
<!-- maintenance-06: Update project README metadata -->
<!-- maintenance-07: Refresh README project notes -->
<!-- maintenance-08: Update documentation maintenance marker -->
<!-- maintenance-09: Refresh README reference block -->
<!-- maintenance-10: Update project documentation note -->
<!-- maintenance-11: Refresh README engineering note -->
<!-- maintenance-12: Update README maintenance metadata -->
<!-- maintenance-13: Refresh project documentation marker -->
<!-- maintenance-14: Update README reference metadata -->
<!-- maintenance-15: Refresh documentation note -->
<!-- maintenance-16: Update README project marker -->
<!-- maintenance-17: Refresh README maintenance reference -->
<!-- maintenance-18: Update documentation metadata -->
<!-- maintenance-19: Refresh project notes in README -->
<!-- maintenance-12: Refresh README project notes -->
<!-- maintenance-13: Update documentation metadata -->
<!-- maintenance-14: Refresh README maintenance note -->
<!-- maintenance-15: Update project documentation marker -->
<!-- maintenance-16: Refresh README reference note -->
<!-- maintenance-17: Update documentation maintenance block -->
<!-- maintenance-18: Refresh project README metadata -->
<!-- maintenance-19: Update README engineering note -->
<!-- maintenance-20: Refresh documentation reference marker -->