import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <main className="legal-page">
      <div className="legal-container">
        <Link className="legal-back" to="/signup">← Back to Sign Up</Link>
        <p className="legal-eyebrow">Alfiya Mehendi</p>
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: September 26, 2026</p>

        <section>
          <h2>1. Overview</h2>
          <p>
            This Privacy Policy explains how Alfiya Mehendi may collect, use, store,
            and share information when you use our website, create an account, shop
            for products, or book mehendi services.
          </p>
        </section>

        <section>
          <h2>2. Information we collect</h2>
          <p>Depending on how you use the website, we may collect:</p>
          <ul>
            <li>Your name and email address.</li>
            <li>Account and authentication information.</li>
            <li>Delivery, billing, booking, and contact details that you provide.</li>
            <li>Order and service-booking information.</li>
            <li>Messages or information you send to us for support.</li>
            <li>Basic technical information needed to operate and secure the website.</li>
          </ul>
        </section>

        <section>
          <h2>3. Google sign-in</h2>
          <p>
            If you choose Google sign-in, Google may provide information such as your
            name, email address, profile identifier, and profile image according to
            Google's authentication process. We use the information necessary to
            authenticate your account and provide the requested service.
          </p>
        </section>

        <section>
          <h2>4. How we use information</h2>
          <p>We may use information to:</p>
          <ul>
            <li>Create and manage your account.</li>
            <li>Process and communicate about orders and bookings.</li>
            <li>Provide customer support.</li>
            <li>Improve website functionality and security.</li>
            <li>Prevent fraud, abuse, and unauthorized activity.</li>
            <li>Meet applicable legal or regulatory requirements.</li>
          </ul>
        </section>

        <section>
          <h2>5. Sharing information</h2>
          <p>
            We do not sell your personal information. We may share information with
            service providers when necessary to operate the website or fulfill your
            request, such as hosting, authentication, payment, communication, and
            delivery providers. We may also disclose information where required by
            applicable law or to protect the website, customers, or our legal rights.
          </p>
        </section>

        <section>
          <h2>6. Data security</h2>
          <p>
            We use reasonable technical and organizational measures intended to protect
            information. No online system can guarantee absolute security, so you
            should also protect your account credentials and avoid sharing passwords.
          </p>
        </section>

        <section>
          <h2>7. Cookies and local storage</h2>
          <p>
            The website may use cookies, browser storage, or similar technologies for
            authentication, preferences, security, and essential functionality. Third
            parties used by the website may have their own technologies and policies.
          </p>
        </section>

        <section>
          <h2>8. Data retention</h2>
          <p>
            We retain information for as long as reasonably necessary for the purposes
            described in this policy, including account management, orders, bookings,
            support, security, and legal obligations.
          </p>
        </section>

        <section>
          <h2>9. Your choices</h2>
          <p>
            You may contact Alfiya Mehendi to ask about the personal information
            associated with your account or to request correction or deletion where
            applicable. Some information may need to be retained where required by law
            or necessary for legitimate business records.
          </p>
        </section>

        <section>
          <h2>10. Children's privacy</h2>
          <p>
            The website is intended for general customers and is not knowingly
            designed to collect personal information from children without appropriate
            authorization.
          </p>
        </section>

        <section>
          <h2>11. Third-party websites</h2>
          <p>
            Links or integrations to third-party services are governed by those
            providers' own privacy policies. Alfiya Mehendi is not responsible for
            privacy practices outside services it does not control.
          </p>
        </section>

        <section>
          <h2>12. Changes to this policy</h2>
          <p>
            We may update this policy when our services, technology, or legal
            requirements change. The latest version will be posted on this page with
            an updated date.
          </p>
        </section>

        <section>
          <h2>13. Contact</h2>
          <p>
            For privacy questions or requests, please use the contact details provided
            on the Alfiya Mehendi website.
          </p>
        </section>

        <div className="legal-footer-links">
          <Link to="/terms">Terms & Conditions</Link>
          <Link to="/contact">Contact</Link>
        </div>
      </div>
    </main>
  );
}
