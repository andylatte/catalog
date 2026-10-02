import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Der Katalog lag früher unter /uebungen; alte Lesezeichen weiterleiten.
  async redirects() {
    return [{ source: "/uebungen/:path*", destination: "/exercises/:path*", permanent: true }];
  },
};

export default nextConfig;
