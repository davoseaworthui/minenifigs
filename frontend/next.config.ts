import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.rebrickable.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.bricklink.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/proxy-image",
        destination: "/api/proxy-image",
      },
    ];
  },
};

export default nextConfig;
