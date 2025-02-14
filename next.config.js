/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['*'], // Be more specific in production
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}

module.exports = nextConfig 