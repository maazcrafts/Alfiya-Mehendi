import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <main className="legal-page">
      <div className="legal-container">
        <Link className="legal-back" to="/signup">← Back to Sign Up</Link>
        <p className="legal-eyebrow">Alfiya Mehendi</p>
        <h1>Terms & Conditions</h1>
        <p className="legal-updated">Last updated: September 26, 2026</p>

        <section>
          <h2>1. About these terms</h2>
          <p>
            These Terms & Conditions govern your use of the Alfiya Mehendi website,
            including product shopping, account features, and mehendi service booking.
            By creating an account or using the website, you agree to these terms.
          </p>
        </section>

        <section>
          <h2>2. Accounts</h2>
          <p>
            You are responsible for providing accurate information when creating an
            account and for keeping your login credentials secure. You are responsible
            for activity carried out through your account.
          </p>
        </section>

        <section>
          <h2>3. Products and pricing</h2>
          <p>
            We aim to keep product descriptions, availability, images, and prices
            accurate. Product availability and prices may change without prior notice.
            An order is subject to availability and confirmation by Alfiya Mehendi.
          </p>
        </section>

        <section>
          <h2>4. Orders and payments</h2>
          <p>
            You agree to provide correct delivery and contact information when placing
            an order. Payment methods, charges, and order confirmation details shown
            at checkout will apply to that order. We may cancel or decline an order
            where an item is unavailable, information is materially incorrect, or a
            transaction cannot be processed.
          </p>
        </section>

        <section>
          <h2>5. Delivery</h2>
          <p>
            Delivery timelines shown on the website are estimates and can be affected
            by location, courier delays, weather, holidays, or other circumstances
            outside our control. You should provide an address where the order can
            reasonably be received.
          </p>
        </section>

        <section>
          <h2>6. Mehendi services and bookings</h2>
          <p>
            Service prices, styles, duration, location, and availability depend on the
            selected service and confirmed booking details. A booking is not confirmed
            until Alfiya Mehendi confirms it. Please provide accurate event date,
            location, and contact information. Changes or cancellations may be subject
            to the cancellation terms communicated for the particular booking.
          </p>
        </section>

        <section>
          <h2>7. Cancellations, returns and refunds</h2>
          <p>
            Product returns, cancellations, and refunds are handled according to the
            applicable policy communicated by Alfiya Mehendi for the relevant order.
            Service cancellations may have different conditions because appointment
            time is reserved specifically for the customer.
          </p>
        </section>

        <section>
          <h2>8. Website use</h2>
          <p>
            You must not misuse the website, attempt unauthorized access, interfere
            with its operation, submit malicious code, or use the website for unlawful
            purposes.
          </p>
        </section>

        <section>
          <h2>9. Intellectual property</h2>
          <p>
            Website text, branding, graphics, photographs, designs, and other original
            content provided by Alfiya Mehendi are protected by applicable intellectual
            property laws. They may not be copied, republished, or commercially used
            without permission.
          </p>
        </section>

        <section>
          <h2>10. Third-party services</h2>
          <p>
            The website may use third-party services such as Google authentication,
            payment providers, hosting providers, analytics tools, or delivery
            services. Their own terms and privacy policies may also apply.
          </p>
        </section>

        <section>
          <h2>11. Changes to these terms</h2>
          <p>
            We may update these terms as the website, products, services, or applicable
            requirements change. The updated version will be posted on this page with
            a revised date.
          </p>
        </section>

        <section>
          <h2>12. Contact</h2>
          <p>
            For questions about these terms, orders, or bookings, please use the
            contact details provided on the Alfiya Mehendi website.
          </p>
        </section>

        <div className="legal-footer-links">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/contact">Contact</Link>
        </div>
      </div>
    </main>
  );
}
