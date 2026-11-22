"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";

const supportEmail = "khanalfiya70399@gmail.com";

export default function Contact() {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setShowModal(true);
  };

  return (
    <main className="page">
      <Header />

      <section className="contact-hero">
        <div className="container">
          <p className="eyebrow">Help & Contact</p>
          <h1>Get in touch</h1>
        </div>
      </section>

      <section className="contact-content">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info">
              <p className="contact-intro">
                For inquiries about bookings, orders, or accounts, please email us at:
              </p>
              <a href={`mailto:${supportEmail}`} className="contact-email">
                {supportEmail}
              </a>
              <p className="contact-response-time">
                We typically respond within 24–48 hours.
              </p>
            </div>

            <div className="contact-form">
              <form onSubmit={handleSubmit} className="contact-form-inner">
                <div className="form-group">
                  <label htmlFor="contact-name">Full name</label>
                  <input
                    id="contact-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="contact-email">Email address</label>
                  <input
                    id="contact-email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="contact-message">Message</label>
                  <textarea
                    id="contact-message"
                    placeholder="Tell us how we can help"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    style={{ minHeight: 120 }}
                  />
                </div>
                {error && <p className="form-error" role="alert">{error}</p>}
                <button type="submit" className="btn btn-primary btn-block">
                  Send message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="contact-faq">
        <div className="container">
          <h2>Frequently asked questions</h2>
          <div className="faq-list">
            <div className="faq-item">
              <h3 className="faq-question">How do I book an appointment?</h3>
              <p className="faq-answer">
                Visit the Services page to view available mehendi designs and
                book an appointment online. You can select your preferred
                design, date, and time, and our artist will confirm your
                booking.
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">What is your cancellation policy?</h3>
              <p className="faq-answer">
                Service cancellations may have different conditions because the
                appointment time is reserved specifically for the customer.
                Please refer to the Terms & Conditions page for detailed policy
                information.
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">Do you travel to the client’s location?</h3>
              <p className="faq-answer">
                Yes, on-location appointments are available depending on the
                service selected and geographic area. Please contact us to
                discuss your requirements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {showModal && (
        <div className="dialog-overlay" onClick={() => setShowModal(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h2 className="dialog-title">Message sent</h2>
            <p className="dialog-description">
              Thank you for your message, {name}. We will get back to you at
              {email} shortly.
            </p>
            <div className="dialog-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
