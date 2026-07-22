import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // ESPN serves every player headshot and team logo from this CDN.
    remotePatterns: [{ protocol: "https", hostname: "a.espncdn.com" }],
  },
};

export default nextConfig;
