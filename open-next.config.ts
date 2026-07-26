import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";

/**
 * `incrementalCache` defaults to "dummy", which silently disables Next's data
 * cache: every `unstable_cache` function recomputes on every request. Backing it
 * with R2 (bound as NEXT_INC_CACHE_R2_BUCKET) is what makes the cached queries
 * in lib/backend/* actually cheap.
 *
 * The regional wrapper puts the colo's Cache API in front of R2 so repeat reads
 * in the same region cost nothing in R2 operations. `short-lived` matches how
 * this app caches: minutes, not days.
 *
 * No queue or tag cache is configured, which is deliberate — the app only uses
 * time-based `unstable_cache`, not ISR or `revalidateTag`. Adding either would
 * mean a Durable Object we do not otherwise need.
 */
export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, {
    mode: "short-lived",
  }),
});
