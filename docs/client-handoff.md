# Alfiya Mehendi — Client Handoff

## Production status

The core customer-to-admin appointment workflow is ready for handoff:

1. Customer creates an account or signs in with Google.
2. Customer browses mehendi services.
3. Customer selects an appointment date and available time.
4. Customer selects the visit location using the OpenStreetMap-powered picker.
5. Customer submits contact details and the appointment request.
6. Admin reviews the request in the admin workspace.
7. Admin confirms, rejects, completes, or cancels the booking.
8. Customer can see the booking status in booking history.

## Production services

- Frontend: Vercel
- Backend API: Render
- Database: PostgreSQL / Supabase-compatible PostgreSQL
- Appointment location: OpenStreetMap + Photon

## Admin operation

The configured ADMIN_EMAIL is the source of truth for administrator access. The backend also verifies administrator access on protected admin routes.

Admin workflow:

- Open the admin area.
- Review incoming appointments.
- Open the booking to inspect customer contact details and the location map.
- Confirm or reject the request.
- Use the customer contact actions when coordination is required.
- Review support and order areas as needed.

Do not share database credentials, JWT secrets, Google OAuth secrets, or payment secrets with customers.

## Environment variables

### Frontend

- VITE_API_URL
- VITE_GOOGLE_CLIENT_ID

### Backend

- DATABASE_URL
- JWT_SECRET
- FRONTEND_URL
- GOOGLE_CLIENT_ID
- ADMIN_EMAIL
- NODE_ENV

Payment variables remain server-side if the payment workflow is enabled later.

## Location service note

The appointment map uses OpenStreetMap tiles and the public Photon geocoder. No Google Maps API key is required for the current implementation.

The public OSM/Photon infrastructure is intended for reasonable usage and is not an unlimited commercial API. If traffic grows substantially, move to an appropriate hosted tile/geocoding provider or self-hosted infrastructure.

## Intentionally deferred

The product/shop area is intentionally left as a coming-soon experience for the current release.

Do not treat the following as required for the current appointment release:

- Product catalogue expansion
- Product imagery
- Full shopping checkout
- Payment completion
- Push notifications
- Android customer app
- Android admin app

These belong to the next development phase.

## Local development

Frontend:

~~~bash
cd frontend
npm install
npm run dev
~~~

Backend:

~~~bash
cd backend
npm install
npm run dev
~~~

## Final QA checklist

Before handing the system to the client, test these flows with production-safe test accounts.

### Customer

- [ ] Signup
- [ ] Login
- [ ] Google login
- [ ] Logout
- [ ] Service loading
- [ ] Date selection
- [ ] Past-date rejection
- [ ] Past-time rejection for today
- [ ] Time-slot availability
- [ ] Location search
- [ ] Current-location selection
- [ ] Location change after selection
- [ ] Booking submission
- [ ] Booking history
- [ ] Pending cancellation
- [ ] Confirmed/rejected status display
- [ ] Profile edit
- [ ] Mobile navigation
- [ ] Terms and privacy pages

### Admin

- [ ] Admin login
- [ ] Non-admin access rejection
- [ ] Booking list
- [ ] Booking details
- [ ] Location map
- [ ] Customer phone/email actions
- [ ] Confirm booking
- [ ] Reject booking
- [ ] Complete/cancel booking
- [ ] Support area
- [ ] Customer-facing navigation from admin

### Production

- [ ] Frontend loads on Vercel
- [ ] Backend health endpoint responds
- [ ] Database connection is healthy
- [ ] Google OAuth production origin is configured
- [ ] No production secrets are committed to Git
- [ ] No test credentials are exposed in the UI
- [ ] Mobile Chrome booking flow works
- [ ] Desktop admin workflow works

## Next phase

After the website is stable, the Android phase can reuse the existing backend and database.

The planned Android architecture is:

~~~text
Customer Android App ─┐
                      ├── Existing API ── PostgreSQL
Admin Android App ────┘
                      │
                      └── Firebase Cloud Messaging
~~~

This keeps booking logic centralized instead of creating a second backend.
