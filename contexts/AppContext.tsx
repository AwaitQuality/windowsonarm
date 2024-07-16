import React, { createContext, ReactNode, useContext, useState } from "react";
import { FullPost } from "@/lib/types/prisma/prisma-types";

interface AppContextType {
  selectedApp: FullPost | null;
  setSelectedApp: React.Dispatch<React.SetStateAction<FullPost | null>>;
  selectedCategory: string | null;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string | null>>;
  selectedStatus: number | undefined | null;
  setSelectedStatus: React.Dispatch<
    React.SetStateAction<number | undefined | null>
  >;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [selectedApp, setSelectedApp] = useState<FullPost | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [selectedStatus, setSelectedStatus] = useState<
    number | undefined | null
  >(undefined);

  return (
    <AppContext.Provider
      value={{
        selectedApp,
        setSelectedApp,
        selectedCategory,
        setSelectedCategory,
        selectedStatus,
        setSelectedStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
