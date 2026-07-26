import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fixes some FluentUI issues
  reactStrictMode: false,
  async headers() {
    return [
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
