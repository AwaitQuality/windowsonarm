"use client";

import React from "react";
import { useQueryStates, parseAsString, parseAsNumberLiteral } from "nuqs";

export type AppContextType = {
  selectedCategory: string | null;
  selectedStatus: number | null;
};

export const AppContext = React.createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [{ category, status }] = useQueryStates({
    category: parseAsString.withDefault(""),
    status: parseAsString.withDefault(""),
  });

  const value = {
    selectedCategory: category || null,
    selectedStatus: status ? parseInt(status) : null,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
