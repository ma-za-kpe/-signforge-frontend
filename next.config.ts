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
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';
    return [
      {
        // Rewrite all /api/* EXCEPT /api/auth/* (which NextAuth handles)
        source: '/api/:path((?!auth).*)',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
