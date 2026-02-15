import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/protocol",
        destination: "https://protocol.hash42.xyz",
        permanent: true, // 308
      },
      {
        source: "/protocol/:path*",
        destination: "https://protocol.hash42.xyz/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;