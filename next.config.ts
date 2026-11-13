import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Os testes de ponta a ponta compilam em pasta própria, para não se misturar com o `npm run dev`.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // Sem o indicador flutuante do Next em desenvolvimento (lei Zero Floating).
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
  allowedDevOrigins: ["192.168.3.114", "192.168.3.114:3000", "localhost", "localhost:3000"],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "192.168.3.114:3000",
        "localhost:3000",
        "192.168.3.114",
        "localhost",
        "*.railway.app",
        "*.up.railway.app",
        ...(process.env.RAILWAY_PUBLIC_DOMAIN ? [process.env.RAILWAY_PUBLIC_DOMAIN] : []),
      ],
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
