import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Disable ESLint during build for specified rules
  eslint: {
    // Warning: This allows production builds to successfully complete even with ESLint errors
    ignoreDuringBuilds: true,
  },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token',
          },
          { key: 'Access-Control-Max-Age', value: '86400' }, // Cache preflight for 24 hours
        ],
      },
    ];
  },
};

export default nextConfig;
