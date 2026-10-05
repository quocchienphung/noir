import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // `*.dev.tsx` routes (the black-hole QA harness) exist only under `next dev`; production builds never
  // see them.
  pageExtensions: process.env.NODE_ENV === "production" ? ["tsx", "ts", "jsx", "js"] : ["dev.tsx", "tsx", "ts", "jsx", "js"],
  // Routes from the previous site that NOIR does not have. Temporary (307) so they can be reused later.
  async redirects() {
    return [
      { source: "/projects/:slug", destination: "/projects", permanent: false },
      { source: "/team/:slug*", destination: "/about", permanent: false },
      { source: "/jobs/:slug*", destination: "/contact", permanent: false },
      { source: "/news", destination: "/", permanent: false },
      { source: "/news/:slug*", destination: "/", permanent: false },
    ];
  },
  images: {
    // Only locally served media may be optimized; nothing remote.
    localPatterns: [{ pathname: "/sites/**", search: "" }],
    deviceSizes: [390, 640, 810, 1080, 1200, 1440, 1920, 2560, 3840],
  },
};

export default nextConfig;
