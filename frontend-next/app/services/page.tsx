import Image from "next/image";
import { Metadata } from "next";
import Link from "next/link";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";

const serviceImages: Record<string, string> = {
  basic:
    "https://images.pexels.com/photos/12872542/pexels-photo-12872542.jpeg?auto=compress&cs=tinysrgb&w=1000",
  intermediate:
    "https://images.pexels.com/photos/11925938/pexels-photo-11925938.jpeg?auto=compress&cs=tinysrgb&w=1000",
  fiveFinger:
    "https://images.pexels.com/photos/5598594/pexels-photo-5598594.jpeg?auto=compress&cs=tinysrgb&w=1000",
  armLength:
    "https://images.pexels.com/photos/20043117/pexels-photo-20043117.jpeg?auto=compress&cs=tinysrgb&w=1000",
  advanced:
    "https://images.pexels.com/photos/4711086/pexels-photo-4711086.jpeg?auto=compress&cs=tinysrgb&w=1000",
  bridal:
    "https://images.pexels.com/photos/13779728/pexels-photo-13779728.jpeg?auto=compress&cs=tinysrgb&w=1200",
};

const levelMeta: Record<string, { label: string; intro: string }> = {
  basic: { label: "Basic", intro: "Simple, elegant designs for everyday occasions." },
  intermediate: { label: "Intermediate", intro: "More detail and coverage for special occasions." },
  advanced: { label: "Advanced", intro: "Statement designs with fuller coverage and detail." },
  bridal: { label: "Bridal", intro: "Dedicated bridal work with richer detail and coverage." },
};

function formatPrice(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

type Service = {
  id: string;
  name: string;
  slug: string;
  level: string;
  description: string;
  price_paise: number;
  duration_minutes: number;
};

/** Static service data matching original Vite structure */
const services: Service[] = [
  {
    id: "1",
    name: "Basic Mehendi Design",
    slug: "basic",
    level: "basic",
    description: "Simple, elegant designs for everyday occasions.",
    price_paise: 500,
    duration_minutes: 30,
  },
  {
    id: "2",
    name: "Intermediate Mehendi Design",
    slug: "intermediate",
    level: "intermediate",
    description: "More detail and coverage for special occasions.",
    price_paise: 1000,
    duration_minutes: 45,
  },
  {
    id: "3",
    name: "Advanced Mehendi Design",
    slug: "advanced",
    level: "advanced",
    description: "Statement designs with fuller coverage and detail.",
    price_paise: 1500,
    duration_minutes: 60,
  },
  {
    id: "4",
    name: "Bridal Mehendi",
    slug: "bridal",
    level: "bridal",
    description: "Dedicated bridal work with richer detail and coverage.",
    price_paise: 2500,
    duration_minutes: 120,
  },
];

function groupServices(services: Service[]) {
  const levels = ["basic", "intermediate", "advanced", "bridal"];
  return levels.map((level) => {
    const groupServices = services.filter((s) => s.level === level);
    return {
      level,
      services: groupServices.length > 0 ? groupServices : [],
    };
  }).filter((group) => group.services.length > 0);
}

/** Server Component metadata */
export const metadata: Metadata = {
  title: "Alfiya Mehendi Services | Mehendi Designs & Booking",
  description:
    "Alfiya Mehendi offers professional mehendi services from basic designs to full bridal coverage. Book appointments, view service levels and pricing.",
  keywords:
    "alfiya mehendi, mehendi services, mehendi artist, bridal mehendi, mehendi design",
  alternates: {
    canonical: "/services",
  },
  openGraph: {
    title: "Alfiya Mehendi Services | Mehendi Designs & Booking",
    description:
      "Alfiya Mehendi offers professional mehendi services from basic designs to full bridal coverage.",
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

export default function Services() {
  const grouped = groupServices(services);

  return (
    <main className="page">
      <Header />

      <section className="services-hero">
        <div className="container">
          <p className="eyebrow">Services</p>
          <h1>Choose your design.</h1>
          <p className="services-hero-description">
            Select a service based on the coverage and detail you want. You can
            select your preferred date and time when booking.
          </p>
        </div>
      </section>

      <section className="services-levels">
        <div className="container">
          {grouped.map((group) => (
            <section key={group.level} className="service-level-section">
              <div className="service-level-heading">
                <div>
                  <p className="eyebrow">{levelMeta[group.level].label}</p>
                  <h2>{levelMeta[group.level].intro}</h2>
                </div>
                <span className="service-count">
                  {group.services.length} {group.services.length === 1 ? "service" : "services"}
                </span>
              </div>

              <div className="service-card-grid">
                {group.services.map((service) => (
                  <article key={service.id} className={`service-card service-card-${group.level}`}>
                    <div className="service-card-image">
                      <Image
                        src={serviceImages[service.slug] || serviceImages.fiveFinger}
                        alt={service.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        priority={group.level === "bridal"}
                      />
                      <span className="service-level-badge">{levelMeta[group.level].label}</span>
                    </div>
                    <div className="service-card-body">
                      <div className="service-card-top">
                        <span className="service-number">
                          {String(group.services.indexOf(service) + 1).padStart(2, "0")}
                        </span>
                        <span className="service-level-label">{levelMeta[group.level].label}</span>
                      </div>
                      <h3>{service.name}</h3>
                      <details className="service-card-details">
                        <summary>View details</summary>
                        <p>{service.description || levelMeta[group.level].intro}</p>
                      </details>
                      <div className="service-card-bottom">
                        <strong>{formatPrice(service.price_paise)}</strong>
                        {service.duration_minutes && <span>{service.duration_minutes} min</span>}
                      </div>
                      <Link
                        href={`/booking?service=${service.slug}`}
                        className="btn btn-primary btn-block"
                      >
                        Book this service
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}

          {grouped.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-mark">✦</div>
              <h2>Services are being prepared.</h2>
              <p>
                The service catalogue is connected. Services will appear here once they are available.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
