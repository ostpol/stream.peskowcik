/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable API routes
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}

module.exports = nextConfig

