"use client";

import dynamic from "next/dynamic";

/**
 * Client boundary for the ad-block nag so it stays out of the shared bundle.
 * The `dynamic(..., { ssr: false })` call has to live in a client component —
 * Next 16 rejects it inside a server component such as app/layout.tsx.
 */
const AdBlockDetector = dynamic(
  () => import("@/components/adblock-detector"),
  { ssr: false }
);

export default function AdBlockDetectorLazy() {
  return <AdBlockDetector />;
}
