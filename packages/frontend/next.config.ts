import type { NextConfig } from 'next';

const NODE_ENV = process.env.NODE_ENV ?? 'development';

const nextConfig: NextConfig = {
  /* config options here */
  trailingSlash: true,
  reactStrictMode: true,
  basePath: NODE_ENV === 'development' ? '' : '/nothing.tech',
  distDir: NODE_ENV === 'development' ? '.next' : '../../docs',
  output: NODE_ENV === 'development' ? 'standalone' : 'export',
};

export default nextConfig;
