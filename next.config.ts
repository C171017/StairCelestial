import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Keep production review builds from replacing a running dev server's chunks.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  transpilePackages: ["three"],
};

export default nextConfig;
