/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // This will allow all domains - you might want to restrict this in production
      },
    ],
  },
}

module.exports = nextConfig 