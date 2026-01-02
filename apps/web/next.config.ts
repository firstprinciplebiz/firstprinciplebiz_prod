import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable transpilation of the shared package
  transpilePackages: ["shared"],
  
  // Image optimization for Supabase Storage
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;














