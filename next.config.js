/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  reactStrictMode: true,
  // Silence Turbopack error: empty config lets Next.js know we acknowledge Turbopack usage
  turbopack: {},
};

module.exports = withPWA(nextConfig);
