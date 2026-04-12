import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed proxy rewrites - now calling backend directly
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // TODO: thêm các hostname khác khi dùng ảnh từ CDN/backend
    ],
  },
};

export default nextConfig;
