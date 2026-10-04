import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SiteShell } from "@/components/sites/norda-framer-website-3f1ea7cb/shared/SiteShell";
import "./globals.css";

// Albert Sans files recovered from the reference @font-face rules (see ASSET_MANIFEST.json).
// "Albert Sans Variable" is the variable-axis file the source requests at weight 400 for body copy;
// "Albert Sans" are the static 500/700 cuts used for display type, labels and links.
const albertVariable = localFont({
  src: "../../public/sites/norda-framer-website-3f1ea7cb/shared/fonts/albert-sans-variable-400.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-albert-variable",
});

const albert = localFont({
  src: [
    { path: "../../public/sites/norda-framer-website-3f1ea7cb/shared/fonts/albert-sans-500.woff2", weight: "500", style: "normal" },
    { path: "../../public/sites/norda-framer-website-3f1ea7cb/shared/fonts/albert-sans-700.woff2", weight: "700", style: "normal" },
    { path: "../../public/sites/norda-framer-website-3f1ea7cb/shared/fonts/albert-sans-500-italic.woff2", weight: "500", style: "italic" },
    { path: "../../public/sites/norda-framer-website-3f1ea7cb/shared/fonts/albert-sans-700-italic.woff2", weight: "700", style: "italic" },
  ],
  display: "swap",
  variable: "--font-albert",
});

const description = "Nordå — architecture & design studio template designed for those shaping the future of urban spaces.";

export const metadata: Metadata = {
  // Local origin only; set NEXT_PUBLIC_SITE_URL when hosting the reconstruction elsewhere.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Nordå Architects",
  description,
  icons: {
    icon: "/sites/norda-framer-website-3f1ea7cb/shared/seo/favicon.png",
    apple: "/sites/norda-framer-website-3f1ea7cb/shared/seo/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    title: "Nordå Architects",
    description,
    images: ["/sites/norda-framer-website-3f1ea7cb/shared/seo/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nordå Architects",
    description,
    images: ["/sites/norda-framer-website-3f1ea7cb/shared/seo/og-image.png"],
  },
  robots: { "max-image-preview": "large" },
};

export const viewport: Viewport = {
  width: "device-width",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${albertVariable.variable} ${albert.variable}`}>
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
