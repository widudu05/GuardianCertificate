import { createContext, useState, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Company } from "@/types";

type CompanyContextType = {
  selectedCompanyId: number | null;
  setSelectedCompanyId: (id: number | null) => void;
  companies: Company[];
  isLoading: boolean;
};

const CompanyContext = createContext<CompanyContextType>({
  selectedCompanyId: null,
  setSelectedCompanyId: () => {},
  companies: [],
  isLoading: false,
});

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  
  // Fetch companies for context
  const { data: companies = [], isLoading } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  return (
    <CompanyContext.Provider
      value={{
        selectedCompanyId,
        setSelectedCompanyId,
        companies,
        isLoading,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompanyContext() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompanyContext must be used within a CompanyProvider");
  }
  return context;
}