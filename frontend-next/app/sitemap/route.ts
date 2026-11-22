import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://alfiya-mehendi.com";

export const GET = async () => {
  const routes = [
    "",
    "/services",
    "/booking",
    "/contact",
    "/products",
  ].map((route) => ({
    url: new URL(route, baseUrl).href,
    lastmod: new Date("2026-11-19").toISOString().split("T")[0],
    changefreq: "monthly",
    priority: route === "" ? 1.0 : route === "/services" ? 0.8 : 0.5,
  }));

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes
      .map(
        (route) =>
          `<url><loc>${route.url}</loc><lastmod>${route.lastmod}</lastmod><changefreq>${route.changefreq}</changefreq><priority>${route.priority}</priority></url>`
      )
      .join("\n")}</urlset>`,
    {
      headers: {
        "Content-Type": "application/xml",
      },
    }
  );
};