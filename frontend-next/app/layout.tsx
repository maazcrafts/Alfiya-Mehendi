import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Alfiya Mehendi",
  description:
    "Professional mehendi services for weddings, bridal, and special occasions",
  email: "khanalfiya70399@gmail.com",
};

export const metadata: Metadata = {
  title: "Alfiya Mehendi",
  description:
    "Alfiya Mehendi — Professional Mehendi Services & Bridal Booking",
  keywords: "mehendi, henna, wedding, mehendi artist, services, booking",
  applicationName: "alfiya-mehendi",
  authors: [{ name: "Alfiya Mehendi Team" }],
  metadataBase: undefined,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${cormorant.variable} ${dmSans.variable}`}>
        {children}
      </body>
    </html>
  );
}
