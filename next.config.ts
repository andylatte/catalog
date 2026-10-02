import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Der Katalog lag früher unter /uebungen und /exercises; alte Lesezeichen weiterleiten.
  async redirects() {
    return [
      { source: "/uebungen/:path*", destination: "/catalog/:path*", permanent: true },
      { source: "/exercises/:path*", destination: "/catalog/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
