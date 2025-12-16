import type { NextConfig } from "next";

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  compress: true, // Enable Gzip compression for text/json/html
  // Silence Turbopack error: empty config lets Next.js know we acknowledge Turbopack usage
  // @ts-ignore
  turbopack: {},
};

export default withPWA(nextConfig);
