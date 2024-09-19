"use client";

import React from "react";
import {
  Title1,
  Title2,
  Text,
  Card,
  CardHeader,
} from "@fluentui/react-components";
import Navigation from "@/components/navigation";

export default function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Navigation className="mb-8" />
      <Title1 className="mb-6 !block">Terms of Service</Title1>
      <Card appearance={"filled-alternative"}>
        <CardHeader>
          <Text weight="semibold" className="!block mb-4">
            Last updated: {new Date().toLocaleDateString()}
          </Text>
        </CardHeader>
        <div className="p-4 space-y-6">
          <Text className="!block mb-4">
            Please read these Terms of Service (&quot;Terms&quot;) carefully
            before using the WindowsOnARM website (windowsonarm.org).
          </Text>

          <div className="space-y-2">
            <Title2 as="h2" className="!block mb-2">
              1. About WindowsOnARM
            </Title2>
            <Text className="!block mb-2">
              WindowsOnARM is an open-source project that provides a list of
              applications that work or don&apos;t work on Windows ARM CPUs.
            </Text>
            <Text className="!block">
              This project is personal and not owned by any company.
            </Text>
          </div>

          <div>
            <Title2 as="h2" className="!block mb-2">
              2. Use of the Website
            </Title2>
            <Text>
              By accessing and using WindowsOnARM, you agree to be bound by
              these Terms.
            </Text>
            <Text>
              If you disagree with any part of the terms, you may not use our
              website.
            </Text>
          </div>

          <div>
            <Title2 as="h2" className="!block mb-2">
              3. User Contributions
            </Title2>
            <Text>
              Users may contribute information about app compatibility. By
              submitting content, you grant WindowsOnARM a non-exclusive,
              royalty-free license to use, modify, and distribute your content.
            </Text>
          </div>

          <div>
            <Title2 as="h2" className="!block mb-2">
              4. Account Registration
            </Title2>
            <Text>
              We use Clerk for user authentication. By creating an account, you
              agree to Clerk&apos;s Terms of Service and Privacy Policy in
              addition to our Terms.
            </Text>
          </div>

          <div>
            <Title2 as="h2" className="!block mb-2">
              5. Disclaimer
            </Title2>
            <Text>
              The information provided on WindowsOnARM is for general
              informational purposes only. We do not guarantee the accuracy or
              completeness of any information on the site.
            </Text>
          </div>

          <div>
            <Title2 as="h2" className="!block mb-2">
              6. Limitation of Liability
            </Title2>
            <Text>
              WindowsOnARM and its contributors shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages
              resulting from your use of or inability to use the website.
            </Text>
          </div>

          <div>
            <Title2 as="h2" className="!block mb-2">
              7. Changes to Terms
            </Title2>
            <Text>
              We reserve the right to modify these Terms at any time. We will
              notify users of any significant changes by posting an update on
              the website.
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
}
