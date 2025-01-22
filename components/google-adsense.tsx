"use client";

import React, { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface GoogleAdsenseProps {
  className?: string;
}

const GoogleAdsense: React.FC<GoogleAdsenseProps> = ({ className }) => {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("Error loading Google AdSense:", err);
    }
  }, []);

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
