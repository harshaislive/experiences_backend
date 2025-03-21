/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '') || 'isdbyvwocudnlwzghphw.supabase.co',
      'images.unsplash.com'
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    },
    // Disable tracing to avoid EPERM permission errors
    trace: false
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig