"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProvider } from "@/contexts/AppContext";
import { Providers } from "@/lib/providers";
import { ClerkProvider } from "@clerk/nextjs";
import React, { useState } from "react";
import { Toaster } from "@fluentui/react-components";

const TOASTER_ID = "toaster";

function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 10,
          },
        },
      }),
  );

  return (
    <AppProvider>
      <ClerkProvider>
        <Providers>
          <QueryClientProvider client={queryClient}>
            <Toaster toasterId={TOASTER_ID} />
            <div className={"min-h-screen h-full"}>{children}</div>
          </QueryClientProvider>
        </Providers>
      </ClerkProvider>
    </AppProvider>
  );
}

export default ClientWrapper;
