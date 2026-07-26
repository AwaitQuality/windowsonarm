"use client";

import { useDetectAdBlock } from "adblock-detect-react";
import { useState, useEffect } from "react";

/**
 * Ad blockers are usually on during local development, so the nag would cover
 * the UI on every page. Skipped unless this is a production build.
 */
const ENABLED = process.env.NODE_ENV === "production";

export default function AdBlockDetector() {
  const adBlockDetected = useDetectAdBlock();
  const [showModal, setShowModal] = useState(true);
  const [timeLeft, setTimeLeft] = useState(5);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    if (!showModal || timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [showModal, timeLeft]);

  if (!ENABLED || !adBlockDetected) return null;

  if (minimized) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-red-500 text-white p-4 text-center z-50 cursor-pointer">
        <p className="text-sm">
          Please disable your ad blocker to support our site. We&apos;ve worked
          very hard to provide the community with a place to find apps and games
          that work on Windows on ARM, but without ads we will not be able to
          keep it up.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 z-50 max-w-lg w-full mx-4">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">
          Ad Blocker Detected
        </h2>
        <p className="text-gray-600 mb-6">
          Please disable your ad blocker to support our site. We&apos;ve worked
          very hard to provide the community with a place to find apps and games
          that work on Windows on ARM, but without ads we will not be able to
          keep it up.
        </p>
        <div className="flex justify-end items-center gap-4">
          <span className="text-sm text-gray-500">
            {timeLeft > 0 ? `Please wait ${timeLeft} seconds...` : ""}
          </span>
          <button
            className={`px-4 py-2 rounded ${
              timeLeft > 0
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-red-500 hover:bg-red-600"
            } text-white transition-colors`}
            onClick={() => {
              if (timeLeft === 0) {
                setShowModal(false);
                setMinimized(true);
              }
            }}
            disabled={timeLeft > 0}
          >
            {timeLeft > 0 ? "Wait..." : "I Understand"}
          </button>
        </div>
      </div>
    </>
  );
}
