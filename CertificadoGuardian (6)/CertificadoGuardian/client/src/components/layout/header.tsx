import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, HelpCircle, Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

export default function Header({ setSidebarOpen }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [notificationCount] = useState(5); // In a real app, this would come from an API

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Menu Button (Mobile) */}
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              type="button"
              className="md:hidden text-slate-500 hover:text-slate-700 focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            {/* Page Title - Dynamically set based on route in a real app */}
            <span className="ml-2 md:ml-0 text-xl font-medium text-slate-800">
              Dashboard
            </span>
          </div>

          {/* Right: User Menu and Notifications */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-slate-600 hover:text-slate-800 focus:outline-none">
                  {notificationCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-danger-500 text-xs text-white p-0">
                      {notificationCount}
                    </Badge>
                  )}
                  <Bell className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <div className="p-3 font-medium text-center border-b">
                  Notificações
                </div>
                <div className="py-2 max-h-72 overflow-y-auto">
                  <div className="p-3 text-sm">
                    <div className="font-medium">Certificado próximo ao vencimento</div>
                    <div className="text-slate-500 text-xs mt-1">
                      Certificado e-CPF Contador vence em 15 dias
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="p-3 text-sm">
                    <div className="font-medium">Certificado expirado</div>
                    <div className="text-slate-500 text-xs mt-1">
                      Certificado e-CNPJ Filial expirou
                    </div>
                  </div>
                </div>
                <div className="p-2 border-t text-center">
                  <Button variant="link" className="text-primary-600 text-sm w-full">
                    Ver todas as notificações
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Help */}
            <Button variant="ghost" size="icon" className="text-slate-600 hover:text-slate-800 focus:outline-none">
              <HelpCircle className="h-6 w-6" />
            </Button>

            {/* User Menu - Would be implemented in a real app */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-1">
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-semibold">
                    {user?.name?.split(" ").map(n => n[0]).join("").toUpperCase() || "U"}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="p-2 text-sm font-medium">
                  {user?.name || "Usuário"}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Perfil</DropdownMenuItem>
                <DropdownMenuItem>Configurações</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
