// Separate client component
"use client";

import { QueryClient, QueryClientProvider } from "react-query";
import { AppProvider } from "@/contexts/AppContext";
import { Providers } from "@/lib/providers";
import { ClerkProvider } from "@clerk/nextjs";
import React from "react";

const queryClient = new QueryClient();

function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <ClerkProvider>
        <Providers>
          <QueryClientProvider client={queryClient}>
            <div className={"min-h-screen h-full"}>{children}</div>
          </QueryClientProvider>
        </Providers>
      </ClerkProvider>
    </AppProvider>
  );
}

export default ClientWrapper;
