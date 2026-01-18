/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@study/shared", "@study/sdk"],
  experimental: {
    // CSS 最適化で lightningcss を使うのをやめる
    optimizeCss: false,
    turbo: false,
  },

};
export default nextConfig;