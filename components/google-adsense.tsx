"use client";

import React, { useEffect } from "react";

/**
 * The AdSense loader replaces this array with its own queue object; pushing a
 * config record onto it is the documented way to request a slot render.
 */
type AdsByGoogleQueue = Array<Record<string, unknown>>;

declare global {
  interface Window {
    adsbygoogle: AdsByGoogleQueue;
  }
}

interface GoogleAdsenseProps {
  className?: string;
  type?: "default" | "in-article";
}

const GoogleAdsense: React.FC<GoogleAdsenseProps> = ({
  className,
  type = "default",
}) => {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("Error loading Google AdSense:", err);
    }
  }, []);

  if (type === "in-article") {
    return (
      <div className={className}>
        <ins
          className="adsbygoogle"
          style={{ display: "block", textAlign: "center" }}
          data-ad-layout="in-article"
          data-ad-format="fluid"
          data-ad-client="ca-pub-2914289587690478"
          data-ad-slot="3157365588"
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%", height: "100%" }}
        data-ad-client="ca-pub-2914289587690478"
        data-ad-slot="7305033150"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default GoogleAdsense;
