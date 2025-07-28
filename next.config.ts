/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  
  // Production optimizations
  poweredByHeader: false,
  compress: true,
  
  // Only ignore errors in development
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV !== 'production',
  },
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV !== 'production',
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  
  // Environment variables validation
  env: {
    BUILDING: process.env.BUILDING,
  },
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['react-icons'],
  },

  // Force dynamic rendering for protected routes
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },

  // Webpack configuration for better compatibility
  webpack: (config: any, { dev, isServer }: any) => {
    // Fix for various module resolution issues
    if (!isServer && dev) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
