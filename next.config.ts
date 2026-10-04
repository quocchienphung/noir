import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    // Only the locally served reconstruction media may be optimized; nothing remote.
    localPatterns: [{ pathname: "/sites/**", search: "" }],
    deviceSizes: [390, 640, 810, 1080, 1200, 1440, 1920, 2560, 3840],
  },
};

export default nextConfig;
