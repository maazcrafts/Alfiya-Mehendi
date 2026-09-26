# ✦ ALFIYA MEHENDI

<p align="center"><img src="frontend/public/alfiya-logo.svg" alt="Alfiya Mehendi" width="120" /></p>
<h3 align="center">A modern digital workspace for mehendi products, services & appointments.</h3>
<p align="center"><em>Traditional craft. Modern experience.</em></p>

<p align="center"><img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" /> <img src="https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white" /> <img src="https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white" /> <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" /></p>

---

## ✧ What is Alfiya?

**Alfiya Mehendi** is a full-stack web application built around a real mehendi business.

It combines two customer journeys:

> 🛍️ **SHOP** mehendi powders, oils, tools and supplies.
>
> ✋ **BOOK** mehendi application services and appointments.

The interface is intentionally built as a **customer workspace** rather than a generic product catalogue.

## ◇ What customers can do

### 🛍️ Shop
- Browse mehendi products
- View product details and stock
- Add products to a persistent cart
- Change quantities or remove items
- View order history

### ✋ Services
- Browse Basic, Intermediate, Advanced and Bridal services
- View service-specific imagery and pricing
- Choose a date
- Choose an available time
- Review an appointment
- Submit a booking request
- Track booking status

### 👤 Account
- View profile information
- Edit customer name
- See authentication/security information
- Access orders, bookings and cart
- Contact support
- Log out securely

### 🆘 Support
- Search FAQs
- Submit support requests
- Track support request status
- Admin support workspace

### 📡 Network UX
- Offline state
- Slow-request feedback
- Connection-restored feedback

## ✦ Service Catalogue

| Level | Service | Price |
|---|---|---:|
| Basic | Palm — Arabic Style | ₹250 |
| Intermediate | Arm Length | ₹500 |
| Intermediate | Five Finger Hand | ₹350 |
| Advanced | Full Length | ₹800 |
| Bridal | Bridal Mehendi | ₹1,750 |

> Pricing is seeded development data and can be changed as the business catalogue evolves.

## ◈ Architecture

~~~text
                    CUSTOMER BROWSER
                           │
                           ▼
                  React + Vite Frontend
                           │
                     HTTPS / JSON
                           ▼
                     Express API
                           │
       ┌───────────────────┼────────────────────┐
       │                   │                    │
     Auth              Commerce          Services
       │                   │                    │
       └───────────────────┼────────────────────┘
                           ▼
                       PostgreSQL
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
       Orders          Bookings          Support
~~~

Detailed architecture: **[docs/system-architecture.md](docs/system-architecture.md)**

## 🧭 Main flows

~~~text
LOGIN / SIGNUP
      ↓
DASHBOARD
  ├── SHOP → PRODUCT → CART
  ├── SERVICES → DATE → TIME → BOOKING
  ├── MY ORDERS
  ├── MY BOOKINGS
  ├── PROFILE
  └── HELP & CONTACT
~~~

### Admin

~~~text
ADMIN WORKSPACE
  ├── Appointments → Review → Confirm / Reject → Complete
  ├── Customer Orders → Review → Manage status
  └── Support Requests → Review → In Progress → Resolved
~~~

## ⚙️ Technology

| Layer | Technology |
|---|---|
| Frontend | React 19 |
| Build | Vite 7 |
| Routing | React Router 7 |
| Backend | Node.js + Express 5 |
| Database | PostgreSQL |
| Database driver | node-postgres |
| Authentication | JWT + Google Identity |
| Password security | Node.js crypto / scrypt |
| API | REST / JSON |
| Styling | Custom CSS + SVG |

## 🗄️ Data model

~~~text
users
 ├── addresses
 ├── carts → cart_items
 ├── orders → order_items
 ├── bookings
 └── support_requests

products → categories / product_images
services → bookings
payments → orders OR bookings
password_reset_tokens → users
~~~

### Important engineering decisions
- Monetary values are stored as paise.
- Historical order items preserve their product name and price.
- Confirmed booking slots have database-level uniqueness protection.
- Customer data is scoped to the authenticated user.
- Admin permissions are enforced by the backend.
- Secrets belong in environment variables.

## 🎨 Design direction

Alfiya deliberately avoids the generic neon SaaS aesthetic.

**Ivory · Sand · Terracotta · Deep Brown · Sage · Editorial Typography**

| Token | Role |
|---|---|
| `#fffaf2` | Ivory |
| `#eee3d2` | Sand |
| `#a05e3e` | Terracotta |
| `#3c2920` | Deep brown |
| `#6e7b5d` | Sage |
| `#d9e1ce` | Soft sage |
| `#dfc29f` | Warm sand |

> **Design principle:** make important information feel important.

Large interfaces, clear states, meaningful interaction and restrained motion are preferred over tiny cards and decoration without purpose.

## 🚀 Getting started

### Clone
~~~bash
git clone https://github.com/maazcrafts/Alfiya-Mehendi.git
cd Alfiya-Mehendi
~~~

### Install
~~~bash
cd frontend && npm install
cd ../backend && npm install
~~~

### Configure

Create `backend/.env` using `backend/.env.example`.

Frontend configuration normally includes:
~~~env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
~~~

Never commit real credentials, database passwords, OAuth secrets or JWT secrets.

### Run backend
~~~bash
cd backend
npm run dev
~~~

API: `http://localhost:5000`

### Run frontend
~~~bash
cd frontend
npm run dev
~~~

Frontend: `http://localhost:5173`

## 🛣️ Roadmap

### ✅ Foundation
- [x] React + Vite frontend
- [x] Express backend
- [x] PostgreSQL schema
- [x] JWT authentication
- [x] Google authentication
- [x] Customer/admin authorization
- [x] Customer profile
- [x] Product catalogue foundation
- [x] Cart API and UI
- [x] Service catalogue
- [x] Appointment booking
- [x] Booking history
- [x] Customer order history
- [x] Admin booking workspace
- [x] Admin order workspace
- [x] Support request system
- [x] Global network-state feedback

### ◐ Next
- [ ] Full checkout workflow
- [ ] Delivery address management
- [ ] Server-side order creation transaction
- [ ] Inventory deduction during order creation
- [ ] Payment integration
- [ ] Product image management
- [ ] Production email delivery
- [ ] Production deployment
- [ ] Expanded admin catalogue management

## 🧱 Engineering principles

**Server owns the rules.** Stock, permissions, booking conflicts and order totals should never be trusted from the browser.

**Historical records stay stable.** An old order should not change because the current product price changed.

**Domains stay separate.** A booking is not an order. A product is not a service. A payment is not an order.

**Build for the real business.** The architecture follows Alfiya's actual workflows instead of forcing the business into a generic ecommerce template.

## 📌 Status

**Active full-stack development.**

The repository currently contains the core foundation for authentication, customer accounts, product browsing, cart management, service discovery, appointment booking, order history, support and administrative workflows.

The next major commerce milestone is completing checkout, order creation, inventory mutation and payments.

---

<p align="center"><strong>✦ From mehendi cones to appointments — one digital workspace.</strong></p>
<p align="center"><sub>Alfiya Mehendi • Full-stack web application</sub></p>