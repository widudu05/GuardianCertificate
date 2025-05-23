import { useState } from "react";
import { Bell, ChevronDown, Menu } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "@/hooks/use-company-context";
import { Company } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Header() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const { companies, selectedCompanyId, setSelectedCompanyId } = useCompanyContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleCompanyChange = (value: string) => {
    const companyId = value ? parseInt(value) : null;
    setSelectedCompanyId(companyId);
    
    // Mostrar toast para informar o usuário
    if (companyId) {
      const company = companies.find(c => c.id === companyId);
      toast({
        title: "Empresa selecionada",
        description: `Mostrando dados de ${company?.name}`,
      });
    } else {
      toast({
        title: "Filtro removido",
        description: "Mostrando dados de todas as empresas",
      });
    }
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (!user || !user.name) return "U";
    
    const names = user.name.split(" ");
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <header className="bg-white border-b border-gray-200 z-10">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex items-center gap-3 ml-auto">
          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="relative p-1.5 rounded-full hover:bg-gray-100 text-gray-600"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </Button>
          </div>
          
          {/* Company Selector */}
          <div className="hidden md:block">
            <Select 
              onValueChange={handleCompanyChange}
              value={selectedCompanyId ? selectedCompanyId.toString() : undefined}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione uma empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Todas as empresas</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id.toString()}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 text-sm focus:outline-none">
                <Avatar className="h-8 w-8 bg-primary-600 text-white">
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
                <span className="hidden md:block font-medium">{user?.name}</span>
                <ChevronDown className="hidden md:block h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Configurações</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
