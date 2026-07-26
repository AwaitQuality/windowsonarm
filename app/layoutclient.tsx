// Separate client component
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Providers } from "@/lib/providers";
import { ClerkProvider } from "@clerk/nextjs";
import React, { useEffect, useState } from "react";
import {
  Toaster,
  useToastController,
  Toast,
  ToastTitle,
  ToastBody,
  Button,
} from "@fluentui/react-components";
import { usePersistedState } from "@/lib/hooks/use-persisted-state";

function ClientWrapper({ children }: { children: React.ReactNode }) {
  // Created per-mount so cached user-specific data is never shared between
  // requests/users during SSR.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
  const toasterId = "toaster";
  const { dispatchToast, dismissToast } = useToastController(toasterId);
  const [cookieConsent, setCookieConsent] = usePersistedState(
    "cookieConsent",
    "false",
  );

  useEffect(() => {
    const handleAcceptCookies = () => {
      dismissToast("cookieConsent");
      setCookieConsent("true");
    };

    if (cookieConsent && cookieConsent !== "true") {
      dispatchToast(
        <Toast>
          <ToastTitle>Cookie Consent</ToastTitle>
          <ToastBody>
            This website uses cookies to enhance the user experience.
            <Button
              appearance="primary"
              className="!mt-2"
              onClick={handleAcceptCookies}
            >
              Accept
            </Button>
          </ToastBody>
        </Toast>,
        { intent: "info", timeout: -1, toastId: "cookieConsent" },
      );
    }
  }, [cookieConsent, dispatchToast]);

  return (
    <ClerkProvider>
      <Providers>
        <QueryClientProvider client={queryClient}>
          <Toaster toasterId={toasterId} />
          {children}
        </QueryClientProvider>
      </Providers>
    </ClerkProvider>
  );
}

export default ClientWrapper;
