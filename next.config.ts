import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    cacheComponents: true,
  partialPrefetching: true,
  // "/" → the visitor's language: Italian browsers (first preference "it…") get /it, everyone else /en
  // (src/app/page.tsx). Temporary redirects, so search engines keep both versions.
  async redirects() {
    return [{ source: "/", has: [{ type: "header", key: "accept-language", value: "it(?:[-;,].*)?" }], destination: "/it", permanent: false }];
  },
  images: {
    // Product photos from the Shopify stores used for recommendations.
    remotePatterns: [{ protocol: "https", hostname: "cdn.shopify.com", pathname: "/s/files/**" }],
  },
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
