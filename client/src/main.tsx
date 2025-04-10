import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/use-auth";
import { CompanyProvider } from "@/hooks/use-company-context";
import App from "./App";
import "./index.css";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CompanyProvider>
        <App />
        <Toaster />
      </CompanyProvider>
    </AuthProvider>
  </QueryClientProvider>
);
