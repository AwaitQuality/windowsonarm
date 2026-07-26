import React from "react";
import Navigation from "@/components/navigation";

/**
 * Shell for the static legal pages.
 *
 * These pages are pure prose, so they deliberately avoid `@fluentui/react-components`:
 * none of its components carry a "use client" directive, so importing one would
 * force the whole page into the client bundle just to render text. The Fluent
 * design tokens are plain CSS custom properties published by `FluentProvider`
 * in the root layout, so the same typography and surface colours are reused here
 * without any Fluent JavaScript.
 */

const titleStyle: React.CSSProperties = {
  fontFamily: "var(--fontFamilyBase)",
  fontSize: "var(--fontSizeHero800)",
  lineHeight: "var(--lineHeightHero800)",
  fontWeight: "var(--fontWeightSemibold)",
  color: "var(--colorNeutralForeground1)",
};

const headingStyle: React.CSSProperties = {
  fontFamily: "var(--fontFamilyBase)",
  fontSize: "var(--fontSizeBase600)",
  lineHeight: "var(--lineHeightBase600)",
  fontWeight: "var(--fontWeightSemibold)",
  color: "var(--colorNeutralForeground1)",
};

const bodyStyle: React.CSSProperties = {
  fontFamily: "var(--fontFamilyBase)",
  fontSize: "var(--fontSizeBase300)",
  lineHeight: "var(--lineHeightBase300)",
  color: "var(--colorNeutralForeground1)",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--colorNeutralBackground2)",
  borderRadius: "var(--borderRadiusMedium)",
  color: "var(--colorNeutralForeground1)",
};

interface LegalPageProps {
  title: string;
  /** ISO date of the last substantive edit, e.g. "2024-11-19". */
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalPage({ title, lastUpdated, children }: LegalPageProps) {
  const formatted = new Date(`${lastUpdated}T00:00:00Z`).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" },
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <Navigation className="mb-8" />
      <h1 className="mb-6 block" style={titleStyle}>
        {title}
      </h1>
      <div style={cardStyle}>
        <div className="px-4 pt-4">
          <p
            className="block"
            style={{ ...bodyStyle, fontWeight: "var(--fontWeightSemibold)" }}
          >
            Last updated:{" "}
            <time dateTime={lastUpdated}>{formatted}</time>
          </p>
        </div>
        <div className="p-4 space-y-6">{children}</div>
      </div>
    </div>
  );
}

interface LegalSectionProps {
  /** Omitted for the intro paragraph that sits above the numbered sections. */
  heading?: string;
  children: React.ReactNode;
}

export function LegalSection({ heading, children }: LegalSectionProps) {
  return (
    <section className="space-y-2">
      {heading && (
        <h2 className="block mb-2" style={headingStyle}>
          {heading}
        </h2>
      )}
      {children}
    </section>
  );
}

export function LegalText({ children }: { children: React.ReactNode }) {
  return (
    <p className="block break-words" style={bodyStyle}>
      {children}
    </p>
  );
}
