import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alfiya Mehendi Services | Mehendi Designs & Booking",
  description:
    "Alfiya Mehendi offers professional mehendi services from basic designs to full bridal coverage. Book appointments, view service levels and pricing.",
  keywords:
    "alfiya mehendi, mehendi services, mehendi artist, bridal mehendi, mehendi design",
  // Open Graph / social sharing
  openGraph: {
    title: "Alfiya Mehendi Services | Mehendi Designs & Booking",
    description:
      "Alfiya Mehendi offers professional mehendi services from basic designs to full bridal coverage. Book appointments and view service levels.",
    images: [
      {
        url: "/hero-service.jpg",
        width: 1200,
        height: 630,
        alt: "Alfiya Mehendi bridal design",
      },
    ],
  },
  // Twitter/X metadata
  twitter: {
    card: "summary_large_image",
    title: "Alfiya Mehendi Services | Mehendi Designs & Booking",
    description:
      "Alfiya Mehendi offers professional mehendi services from basic designs to full bridal coverage.",
    images: ["/hero-service.jpg"],
    creator: "@alfiya_mehendi",
  },
};