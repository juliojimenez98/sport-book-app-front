import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // AWS S3 bucket (presigned URL redirect target)
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
      // Backend API proxy (for development)
      {
        protocol: "http",
        hostname: "localhost",
        port: "5001",
      },
    ],
  },
};

export default nextConfig;

