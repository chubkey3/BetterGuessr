/** @type {import('next').NextConfig} */

const withPWA = require("next-pwa");

const nextConfig = {
  reactStrictMode: false,
  env: {
    PROD: process.env.PROD
  }
}

const PWAConfig = withPWA({
    dest: "public",
    register: true,
    skipWaiting: true
})

module.exports = PWAConfig(nextConfig)