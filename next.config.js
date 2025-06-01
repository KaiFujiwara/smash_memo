/** @type {import('next').NextConfig} */
const nextConfig = {
  // React StrictModeを無効化（ドラッグ&ドロップライブラリの競合回避）
  reactStrictMode: false,
}

module.exports = nextConfig
