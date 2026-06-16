import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed proxy rewrites - now calling backend directly
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "**.b-cdn.net",
      },
      {
        protocol: "https",
        hostname: "vz-e0f2a12f-935.b-cdn.net",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      // TODO: thêm các hostname khác khi dùng ảnh từ CDN/backend
    ],
  },
};

export default nextConfig;
