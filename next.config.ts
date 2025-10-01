import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    // Turbopack kök dizinini açıkça belirterek lockfile yanlış kök tespitini susturur
    root: __dirname,
  },
};

export default nextConfig;
