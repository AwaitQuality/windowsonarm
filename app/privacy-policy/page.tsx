"use client";

import React, { Suspense } from "react";
import {
  Title1,
  Title2,
  Text,
  Card,
  CardHeader,
} from "@fluentui/react-components";
import Navigation from "@/components/navigation";

export default function PrivacyPolicy() {
  return (
    <Suspense>
      <div className="container mx-auto px-4 py-8">
        <Navigation className="mb-8" />
        <Title1 className="mb-6 !block">Privacy Policy</Title1>
        <Card appearance={"filled-alternative"}>
          <CardHeader>
            <Text weight="semibold" className="!block mb-4">
              Last updated: {new Date().toLocaleDateString()}
            </Text>
          </CardHeader>
          <div className="p-4 space-y-6">
            <Text className="!block mb-4">
              This Privacy Policy describes how WindowsOnARM (&quot;we&quot;,
              &quot;us&quot;, or &quot;our&quot;) collects, uses, and shares your
              information when you use our website (windowsonarm.org).
            </Text>

            <div className="space-y-2">
              <Title2 as="h2" className="!block mb-2">
                1. Information We Collect
              </Title2>
              <Text className="!block mb-2">
                We collect information you provide when you contribute to the app
                compatibility list or interact with our website.
              </Text>
              <Text className="!block">
                This may include your username and any content you submit.
              </Text>
            </div>

            <div className="space-y-2">
              <Title2 as="h2" className="!block mb-2">
                2. Authentication and User Accounts
              </Title2>
              <Text className="!block mb-2">
                We use Clerk for user authentication. We do not store account
                information in our database.
              </Text>
              <Text className="!block">
                Please refer to Clerk&apos;s Privacy Policy for information on how
                they handle your data.
              </Text>
            </div>

            <div className="space-y-2">
              <Title2 as="h2" className="!block mb-2">
                3. Analytics
              </Title2>
              <Text className="!block">
                We use Google Analytics and Cloudflare Analytics to understand
                website usage patterns. These services may collect information
                such as your IP address, browser type, and pages visited.
              </Text>
            </div>

            <div className="space-y-2">
              <Title2 as="h2" className="!block mb-2">
                4. How We Use Your Information
              </Title2>
              <Text className="!block">
                We use the collected information to improve our website, maintain
                the app compatibility list, and analyze usage patterns to enhance
                user experience.
              </Text>
            </div>

            <div className="space-y-2">
              <Title2 as="h2" className="!block mb-2">
                5. Data Sharing and Disclosure
              </Title2>
              <Text className="!block">
                We do not sell your personal information. We may share anonymized,
                aggregated data for analytical purposes or as required by law.
              </Text>
            </div>

            <div className="space-y-2">
              <Title2 as="h2" className="!block mb-2">
                6. Data Security
              </Title2>
              <Text className="!block">
                We use Cloudflare for hosting and security. Please refer to
                Cloudflare&apos;s security practices for more information on how
                your data is protected.
              </Text>
            </div>

            <div className="space-y-2">
              <Title2 as="h2" className="!block mb-2">
                7. Your Rights
              </Title2>
              <Text className="!block">
                You have the right to access, correct, or delete your personal
                information. Please contact us to exercise these rights.
              </Text>
            </div>

            <div className="space-y-2">
              <Title2 as="h2" className="!block mb-2">
                8. Changes to This Policy
              </Title2>
              <Text className="!block">
                We may update this privacy policy from time to time. We will
                notify you of any changes by posting the new policy on this page.
              </Text>
            </div>
          </div>
        </Card>
      </div>
    </Suspense>
  );
}
