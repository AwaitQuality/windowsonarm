import "./globals.css";
import React from "react";
import type { Metadata, Viewport } from "next";
import ClientWrapper from "@/app/layoutclient";

export const metadata: Metadata = {
  title: "Windows on ARM | App Compatibility List",
  description:
    "A community-driven list of apps and games that work, are emulated or don't work on Windows on ARM",
  metadataBase: new URL("https://windowsonarm.org"),
  keywords: [
    "windows",
    "arm",
    "windows on arm",
    "app compatibility",
    "windows 10",
    "windows 11",
    "arm ready software",
  ],
  alternates: {
    canonical: "/",
  },
  /*openGraph: {
    title: "Windows on ARM",
    description:
      "A community-driven list of apps that work (or don't work) on Windows on ARM",
    url: "https://windowsonarm.org",
    siteName: "Windows on ARM App Compatibility",
    images: [
      {
        url: "/assets/og-image.png",
        width: 1200,
        height: 630,
        alt: "Windows on ARM App Compatibility",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  /*twitter: {
    card: "summary_large_image",
    title: "Windows on ARM",
    description:
      "A community-driven list of apps that work (or don't work) on Windows on ARM",
    images: ["/assets/og-image.png"],
    creator: "@opensource003",
  },*/
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicons/favicon.ico" },
      { url: "/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/favicons/apple-touch-icon.png" }],
    other: [
      {
        rel: "mask-icon",
        url: "/favicons/safari-pinned-tab.svg",
      },
      {
        rel: "shortcut icon",
        url: "/favicons/favicon.ico",
      },
    ],
  },
  manifest: "/favicons/site.webmanifest",
  category: "technology",
  other: {
    "msapplication-TileColor": "#da532c",
    "msapplication-config": "/favicons/browserconfig.xml",
  },
};

export const viewport: Viewport = {
  themeColor: "#60A6FB",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
