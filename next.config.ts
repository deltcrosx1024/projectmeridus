import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: ["local-origin.dev", "*local-origin.dev", "localhost", "127.0.0.1", "*"],
};

export default nextConfig;
