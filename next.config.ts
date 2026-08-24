import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ioymqsmzgmoxqrjhqods.supabase.co",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "recharts"],
  },
  async redirects() {
    return [{ source: "/cash", destination: "/dashboard", permanent: true }];
  },
};

export default nextConfig;
