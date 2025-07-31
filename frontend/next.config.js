/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript and ESLint configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Image configuration
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },

  // Configure webpack for face-api.js compatibility
  webpack: (config, { isServer }) => {
    // Fix for face-api.js in browser environment
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        encoding: false,
        canvas: false
      }
    }

    return config
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_NAME: 'IRIS Facial Analysis',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
    NEXT_PUBLIC_MODELS_PATH: '/models',
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:5001'
  },

  // Experimental features
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['framer-motion', 'lucide-react']
  },

  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  }
}

module.exports = nextConfig
