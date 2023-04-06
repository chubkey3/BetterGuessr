/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  env: {
    PROD: process.env.PROD
  }
}

module.exports = nextConfig
