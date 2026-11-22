import Image from "next/image";
import Link from "next/link";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";

export default function About() {
  return (
    <main className="page">
      <Header />

      <section className="about-hero">
        <div className="container">
          <div className="about-grid">
            <div className="about-image">
              <Image
                src="https://images.pexels.com/photos/13779728/pexels-photo-13779728.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Alfiya Mehendi artist at work"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
            <div className="about-text">
              <p className="eyebrow">Professional Mehendi Services</p>
              <h2>Artistry for Your Special Occasions</h2>
              <p>
                I am Alfiya, a skilled mehendi artist creating intricate designs
                for weddings, bridal events, and special occasions. My work
                brings the art of mehendi to your doorstep, ensuring a
                comfortable and memorable experience for every client.
              </p>
              <ul className="about-list">
                <li>Bridal mehendi designs</li>
                <li>Everyday mehendi art</li>
                <li>Wedding party services</li>
                <li>On-location appointments</li>
              </ul>
              <Link href="/services" className="btn btn-primary btn-block">
                Book a service
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="about-approach">
        <div className="container container-read">
          <h2>How it works</h2>
          <div className="about-steps">
            <div className="about-step">
              <span className="about-step-number">01</span>
              <h3>Choose your service</h3>
              <p>Select from basic, intermediate, advanced, or bridal mehendi designs.</p>
            </div>
            <div className="about-step">
              <span className="about-step-number">02</span>
              <h3>Pick your date and time</h3>
              <p>Choose an available appointment slot that works for you.</p>
            </div>
            <div className="about-step">
              <span className="about-step-number">03</span>
              <h3>Tell us where to come</h3>
              <p>Select your appointment location on the map.</p>
            </div>
            <div className="about-step">
              <span className="about-step-number">04</span>
              <h3>Confirm your details</h3>
              <p>Review your booking and submit your request.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
