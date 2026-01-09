import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.aldersgatechristian.com',
        pathname: '/wp-content/uploads/**',
      },
    ],
  },
};

export default nextConfig;
