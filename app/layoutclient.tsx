// Separate client component
"use client";

import { QueryClient, QueryClientProvider } from "react-query";
import { AppProvider } from "@/contexts/AppContext";
import { Providers } from "@/lib/providers";
import { ClerkProvider } from "@clerk/nextjs";
import React, { useEffect } from "react";
import {
  Toaster,
  useToastController,
  Toast,
  ToastTitle,
  ToastBody,
  Button,
} from "@fluentui/react-components";
import { usePersistedState } from "@/lib/persisted-state";

const queryClient = new QueryClient();

function ClientWrapper({ children }: { children: React.ReactNode }) {
  const toasterId = "toaster";
  const { dispatchToast, dismissToast } = useToastController(toasterId);
  const [cookieConsent, setCookieConsent] = usePersistedState(
    "cookieConsent",
    "false"
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
        { intent: "info", timeout: -1, toastId: "cookieConsent" }
      );
    }
  }, [cookieConsent, dispatchToast]);

  return (
    <AppProvider>
      <ClerkProvider>
        <Providers>
          <QueryClientProvider client={queryClient}>
            <Toaster toasterId={toasterId} />
            {children}
          </QueryClientProvider>
        </Providers>
      </ClerkProvider>
    </AppProvider>
  );
}

export default ClientWrapper;
