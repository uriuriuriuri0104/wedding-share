/** @type {import('next').NextConfig} */
// cache bust

const remotePatterns = []

if (process.env.R2_PUBLIC_URL) {
  try {
    const { hostname, protocol } = new URL(process.env.R2_PUBLIC_URL)
    remotePatterns.push({ protocol: protocol.replace(':', ''), hostname })
  } catch {}
}

const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
    remotePatterns,
  },
  experimental: {
    serverComponentsExternalPackages: ['@libsql/client', 'sharp'],
  },
}

module.exports = nextConfig
