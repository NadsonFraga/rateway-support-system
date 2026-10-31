import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Os testes de ponta a ponta compilam em pasta própria, para não se misturar com o `npm run dev`.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // Sem o indicador flutuante do Next em desenvolvimento (lei Zero Floating).
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
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
