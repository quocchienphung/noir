import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { NoirShell } from "@/components/noir/shell/NoirShell";
import { brand } from "@/data/noir/site";
import "./globals.css";

// Albert Sans (SIL Open Font License 1.1), self-hosted: the variable file for body copy and the static
// 500–700 cuts for display type and labels.
const albertVariable = localFont({
  src: "../../public/sites/noir/fonts/albert-sans-variable-400.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-albert-variable",
});

const albert = localFont({
  src: [
    { path: "../../public/sites/noir/fonts/albert-sans-v4-latin-400-600.woff2", weight: "400", style: "normal" },
    { path: "../../public/sites/noir/fonts/albert-sans-500.woff2", weight: "500", style: "normal" },
    { path: "../../public/sites/noir/fonts/albert-sans-v4-latin-400-600.woff2", weight: "600", style: "normal" },
    { path: "../../public/sites/noir/fonts/albert-sans-700.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-albert",
});

const title = `${brand.name} — ${brand.tagline}`;

export const metadata: Metadata = {
  // Local origin only; set NEXT_PUBLIC_SITE_URL when hosting elsewhere.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: title, template: `%s — ${brand.name}` },
  description: brand.description,
  applicationName: brand.name,
  icons: {
    icon: [
      { url: "/sites/noir/seo/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/sites/noir/seo/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/sites/noir/seo/apple-touch-icon.png",
  },
  manifest: "/sites/noir/seo/site.webmanifest",
  openGraph: {
    type: "website",
    siteName: brand.name,
    title,
    description: brand.description,
    images: [{ url: "/sites/noir/seo/og-image.jpg", width: 1200, height: 630, alt: `${brand.name} — ${brand.tagline}` }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: brand.description,
    images: ["/sites/noir/seo/og-image.jpg"],
  },
  robots: { "max-image-preview": "large" },
};

export const viewport: Viewport = {
  width: "device-width",
  themeColor: "#050505",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${albertVariable.variable} ${albert.variable}`}>
      <body>
        <NoirShell>{children}</NoirShell>
      </body>
    </html>
  );
}
