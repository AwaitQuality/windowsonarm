import React from "react";
import type { Metadata } from "next";
import {
  LegalPage,
  LegalSection,
  LegalText,
} from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service - Windows on ARM",
  description:
    "The terms that apply to your use of the WindowsOnARM app compatibility list at windowsonarm.org.",
  alternates: { canonical: "/terms-of-service" },
};

/** Bump whenever the text below actually changes. */
const LAST_UPDATED = "2024-09-19";

export default function TermsOfService() {
  return (
    <LegalPage title="Terms of Service" lastUpdated={LAST_UPDATED}>
      <LegalSection>
        <LegalText>
          Please read these Terms of Service (&quot;Terms&quot;) carefully before
          using the WindowsOnARM website (windowsonarm.org).
        </LegalText>
      </LegalSection>

      <LegalSection heading="1. About WindowsOnARM">
        <LegalText>
          WindowsOnARM is an open-source project that provides a list of
          applications that work or don&apos;t work on Windows ARM CPUs.
        </LegalText>
        <LegalText>
          This project is personal and not owned by any company.
        </LegalText>
      </LegalSection>

      <LegalSection heading="2. Use of the Website">
        <LegalText>
          By accessing and using WindowsOnARM, you agree to be bound by these
          Terms.
        </LegalText>
        <LegalText>
          If you disagree with any part of the terms, you may not use our
          website.
        </LegalText>
      </LegalSection>

      <LegalSection heading="3. User Contributions">
        <LegalText>
          Users may contribute information about app compatibility. By submitting
          content, you grant WindowsOnARM a non-exclusive, royalty-free license
          to use, modify, and distribute your content.
        </LegalText>
      </LegalSection>

      <LegalSection heading="4. Account Registration">
        <LegalText>
          We use Clerk for user authentication. By creating an account, you agree
          to Clerk&apos;s Terms of Service and Privacy Policy in addition to our
          Terms.
        </LegalText>
      </LegalSection>

      <LegalSection heading="5. Disclaimer">
        <LegalText>
          The information provided on WindowsOnARM is for general informational
          purposes only. We do not guarantee the accuracy or completeness of any
          information on the site.
        </LegalText>
      </LegalSection>

      <LegalSection heading="6. Limitation of Liability">
        <LegalText>
          WindowsOnARM and its contributors shall not be liable for any indirect,
          incidental, special, consequential, or punitive damages resulting from
          your use of or inability to use the website.
        </LegalText>
      </LegalSection>

      <LegalSection heading="7. Changes to Terms">
        <LegalText>
          We reserve the right to modify these Terms at any time. We will notify
          users of any significant changes by posting an update on the website.
        </LegalText>
      </LegalSection>
    </LegalPage>
  );
}
