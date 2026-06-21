import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "192.168.1.12:3000"],
    },
  },
  allowedDevOrigins: ["192.168.1.12"],
};

export default nextConfig;