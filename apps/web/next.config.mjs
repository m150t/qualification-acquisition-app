/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@study/shared", "@study/sdk"],
  experimental: {
    optimizeCss: false,
  },
};

export default nextConfig;
