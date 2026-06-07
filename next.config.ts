import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: '/sw.js',
      headers: [
        { key: 'Cache-Control', value: 'no-cache' },
        { key: 'Content-Type', value: 'application/javascript' },
        { key: 'Service-Worker-Allowed', value: '/' },
      ],
    },
  ],
}

export default nextConfig
