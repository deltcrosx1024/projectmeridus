import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Production-ready configuration */
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ];
  },
  
  // Images configuration
  images: {
    domains: [
      'avatars.githubusercontent.com',
      'github.com',
      'avatars.discordapp.com',
      'cdn.discordapp.com'
    ],
    deviceSizes: [640, 768, 1024, 1280, 1600, 2048],
    imageSizes: [16, 32, 48, 64, 96],
    path: '/_next/image',
    loader: 'default',
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },
  
  // Optimize fonts
  experimental: {
    optimizePackageImports: ['@mui/material', 'lodash'],
  },
  
  // Disable etag generation for better caching control
  generateEtags: false,
  
  // Production safety: disable warnings in production
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  // Allowed dev origins for development
  allowedDevOrigins: ["local-origin.dev", "*local-origin.dev", "localhost", "127.0.0.1"],
};

export default nextConfig;
