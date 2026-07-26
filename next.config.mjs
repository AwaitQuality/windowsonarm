import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

/**
 * Applied to every route. Deliberately excludes Content-Security-Policy: this
 * app loads Google AdSense, Clerk, Giscus and Discord CDN assets, so a CSP
 * needs a verified allowlist for each before it can be enforced rather than
 * silently breaking them.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fixes some FluentUI issues
  reactStrictMode: false,
  experimental: {
    // These are barrel packages imported by many files; without this every
    // import pulls the whole barrel.
    optimizePackageImports: [
      "@fluentui/react-components",
      "@fluentui/react-icons",
      "@icons-pack/react-simple-icons",
      "recharts",
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/api/v1/posts/:id/forum",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0",
          },
        ],
      },
    ];
  },
};

// Makes the Cloudflare bindings declared in wrangler.toml (D1, vars) available
// to `next dev`, the same way they are in a deployed Worker.
initOpenNextCloudflareForDev();

export default nextConfig;
