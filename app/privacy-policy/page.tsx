import React from "react";
import type { Metadata } from "next";
import {
  LegalPage,
  LegalSection,
  LegalText,
} from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy - Windows on ARM",
  description:
    "How WindowsOnARM collects, uses and shares information about visitors to windowsonarm.org.",
  alternates: { canonical: "/privacy-policy" },
};

/** Bump whenever the text below actually changes. */
const LAST_UPDATED = "2024-11-19";

export default function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated={LAST_UPDATED}>
      <LegalSection>
        <LegalText>
          This Privacy Policy describes how WindowsOnARM (&quot;we&quot;,
          &quot;us&quot;, or &quot;our&quot;) collects, uses, and shares your
          information when you use our website (windowsonarm.org).
        </LegalText>
      </LegalSection>

      <LegalSection heading="1. Information We Collect">
        <LegalText>
          We collect information you provide when you contribute to the app
          compatibility list or interact with our website.
        </LegalText>
        <LegalText>
          This may include your username and any content you submit.
        </LegalText>
      </LegalSection>

      <LegalSection heading="2. Authentication and User Accounts">
        <LegalText>
          We use Clerk for user authentication. We do not store account
          information in our database.
        </LegalText>
        <LegalText>
          Please refer to Clerk&apos;s Privacy Policy for information on how they
          handle your data.
        </LegalText>
      </LegalSection>

      <LegalSection heading="3. Analytics">
        <LegalText>
          We use Google Analytics and Cloudflare Analytics to understand website
          usage patterns. These services may collect information such as your IP
          address, browser type, and pages visited.
        </LegalText>
      </LegalSection>

      <LegalSection heading="4. How We Use Your Information">
        <LegalText>
          We use the collected information to improve our website, maintain the
          app compatibility list, and analyze usage patterns to enhance user
          experience.
        </LegalText>
      </LegalSection>

      <LegalSection heading="5. Data Sharing and Disclosure">
        <LegalText>
          We do not sell your personal information. We may share anonymized,
          aggregated data for analytical purposes or as required by law.
        </LegalText>
      </LegalSection>

      <LegalSection heading="6. Data Security">
        <LegalText>
          We use Cloudflare for hosting and security. Please refer to
          Cloudflare&apos;s security practices for more information on how your
          data is protected.
        </LegalText>
      </LegalSection>

      <LegalSection heading="7. Your Rights">
        <LegalText>
          You have the right to access, correct, or delete your personal
          information. Please contact us to exercise these rights.
        </LegalText>
      </LegalSection>

      <LegalSection heading="8. Changes to This Policy">
        <LegalText>
          We may update this privacy policy from time to time. We will notify you
          of any changes by posting the new policy on this page.
        </LegalText>
      </LegalSection>
    </LegalPage>
  );
}
