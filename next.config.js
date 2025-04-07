/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  // Favicon can be served from the public directory
  images: {
    domains: [],
  },
}

module.exports = nextConfig 