import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['@boatly/shared-types', '@boatly/ui-components'],
};

export default nextConfig;
