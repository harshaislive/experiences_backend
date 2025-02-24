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
    }
  }
}

module.exports = nextConfig 