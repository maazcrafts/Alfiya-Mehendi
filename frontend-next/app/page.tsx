import Image from "next/image";
import Link from "next/link";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

const serviceRows = [
  {
    slug: "basic",
    name: "Basic Mehendi",
    description: "Simple, elegant designs for everyday occasions.",
    price: "₹500",
    duration: "30 min",
    image:
      "https://images.pexels.com/photos/12872542/pexels-photo-12872542.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    slug: "intermediate",
    name: "Intermediate Mehendi",
    description: "More detail and coverage for special occasions.",
    price: "₹1,000",
    duration: "45 min",
    image:
      "https://images.pexels.com/photos/11925938/pexels-photo-11925938.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    slug: "advanced",
    name: "Advanced Mehendi",
    description: "Statement designs with fuller coverage and detail.",
    price: "₹1,500",
    duration: "60 min",
    image:
      "https://images.pexels.com/photos/4711086/pexels-photo-4711086.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    slug: "bridal",
    name: "Bridal Mehendi",
    description: "Dedicated bridal work with richer detail and coverage.",
    price: "₹2,500",
    duration: "120 min",
    image:
      "https://images.pexels.com/photos/13779728/pexels-photo-13779728.jpeg?auto=compress&cs=tinysrgb&w=1000",
  },
];

export const metadata = {
  title: "Alfiya Mehendi — Professional Mehendi Services & Bridal Booking",
  description:
    "Alfiya Mehendi offers professional mehendi services from basic designs to full bridal coverage. Book your appointment online.",
  keywords: "mehendi, henna, wedding, mehendi artist, bridal mehendi, booking",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Alfiya Mehendi — Professional Mehendi Services",
    description:
      "Professional mehendi services for weddings, bridal, and special occasions.",
    images: [
      {
        url: "https://images.pexels.com/photos/13779728/pexels-photo-13779728.jpeg?auto=compress&cs=tinysrgb&w=1200",
        width: 1200,
        height: 630,
        alt: "Alfiya Mehendi bridal design",
      },
    ],
  },
};

export default function Home() {
  return (
    <main className="page">
      <Header />

      <section className="hero">
        <div className="hero-content">
          <p className="hero-kicker">Alfiya Mehendi</p>
          <h1>Traditional craft. Modern appointment.</h1>
          <p className="hero-description">
            Intricate mehendi designs for weddings, bridal events, and special
            occasions — created with care and booked online in minutes.
          </p>
          <div className="hero-actions">
            <Link href="/services" className="btn btn-primary">
              Explore services
            </Link>
            <Link href="/booking" className="btn btn-secondary">
              Book an appointment
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <Image
            src="https://images.pexels.com/photos/13779728/pexels-photo-13779728.jpeg?auto=compress&cs=tinysrgb&w=1200"
            alt="Bridal mehendi design on hands"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>
      </section>

      <section className="services-intro">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Our services</p>
              <h2>Choose your level of detail</h2>
            </div>
          </div>
          <div className="services-grid">
            {serviceRows.map((service) => (
              <article
                key={service.slug}
                className="service-card"
              >
                <div className="image-wrap" style={{ height: 240 }}>
                  <Image
                    src={service.image}
                    alt={service.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    priority={service.slug === "bridal"}
                  />
                </div>
                <div className="service-body">
                  <h3>{service.name}</h3>
                  <p>{service.description}</p>
                  <div className="service-meta">
                    <span>{service.price}</span>
                    <span>{service.duration}</span>
                  </div>
                  <Link
                    href={`/booking?service=${service.slug}`}
                    className="btn btn-ghost btn-sm"
                  >
                    Book this service
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="brand-story">
        <div className="container container-read">
          <h2>About Alfiya</h2>
          <p>
            I am Alfiya, a mehendi artist dedicated to creating intricate,
            meaningful designs for your most special occasions. Whether you are
            looking for a simple everyday pattern or full bridal coverage, my
            services are crafted to match your style and comfort.
          </p>
          <p>
            Every appointment is a personal consultation. Choose your service,
            select your date and time, and tell us where you would like us to
            come. We handle the rest.
          </p>
          <div className="brand-actions">
            <Link href="/about" className="btn btn-secondary">
              Learn more
            </Link>
            <Link href="/contact" className="btn btn-ghost">
              Get in touch
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
