import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/sign_images/**',
      },
      {
        protocol: 'https',
        hostname: 'invigorating-forgiveness-production-a14c.up.railway.app',
        pathname: '/sign_images/**',
      },
    ],
  },
};

export default nextConfig;
