/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@mulligans/ui', '@mulligans/api-client'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.cloudfront.net',
      },
    ],
  },
};
module.exports = nextConfig;