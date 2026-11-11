import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "images.pexels.com"
      },
      {
        protocol: "https",
        hostname: "backend.monimal.com"
      },
      {
        protocol: "https",
        hostname: "backend.monimala.com"
      },
      {
        protocol: "https",
        hostname: "monimala.com"
      },
      {
        protocol: "https",
        hostname: "www.monimala.com"
      },
      {
        protocol: "https",
        hostname: "lightskyblue-swan-841286.hostingersite.com"
      }
    ]
  },
  experimental: {
    optimizePackageImports: ["lucide-react"]
  }
};

export default nextConfig;
