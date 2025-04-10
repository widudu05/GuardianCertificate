import { useState } from "react";
import { useLocation } from "wouter";
import Sidebar from "./sidebar";
import Header from "./header";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();

  // Get title based on current location
  const getTitle = () => {
    switch (location) {
      case "/":
        return "Dashboard";
      case "/certificates":
        return "Certificados Digitais";
      case "/users":
        return "Gerenciamento de Usuários";
      case "/logs":
        return "Logs e Auditoria";
      case "/settings":
        return "Configurações";
      default:
        return "Guardião de Certificados";
    }
  };

  // Set document title
  document.title = `${getTitle()} | Guardião de Certificados`;

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header setSidebarOpen={setSidebarOpen} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
