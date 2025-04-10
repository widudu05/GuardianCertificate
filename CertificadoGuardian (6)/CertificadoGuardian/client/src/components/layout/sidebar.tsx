import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Shield, 
  Home, 
  FileText, 
  Users, 
  ListTodo, 
  Settings, 
  ChevronDown, 
  BookOpen, 
  LineChart,
  BarChart4
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const [location] = useLocation();
  const { companies, currentCompany, setCurrentCompany, user } = useAuth();
  const [currentPath, setCurrentPath] = useState(location);

  // Update current path when location changes
  useEffect(() => {
    setCurrentPath(location);
  }, [location]);

  // Handle company change
  const handleCompanyChange = (companyId: string) => {
    const company = companies.find(c => c.id.toString() === companyId);
    if (company) {
      setCurrentCompany(company);
    }
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: <Home className="h-5 w-5 mr-3" /> },
    { path: "/certificates", label: "Certificados", icon: <FileText className="h-5 w-5 mr-3" /> },
    { path: "/users", label: "Usuários", icon: <Users className="h-5 w-5 mr-3" /> },
    { path: "/logs", label: "Logs & Auditoria", icon: <ListTodo className="h-5 w-5 mr-3" /> },
    { path: "/settings", label: "Configurações", icon: <Settings className="h-5 w-5 mr-3" /> },
    { path: "/documentation", label: "Documentação", icon: <BookOpen className="h-5 w-5 mr-3" /> },
  ];
  
  // Adicionar o link para o painel de administração apenas para usuários com papel de administrador
  if (user?.role === 'admin' || user?.role === 'super_admin') {
    navItems.push({ 
      path: "/admin/dashboard", 
      label: "Painel Admin", 
      icon: <BarChart4 className="h-5 w-5 mr-3" /> 
    });
  }

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {open && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-slate-600 bg-opacity-75"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 flex flex-col z-50 w-64 bg-slate-800 text-white transform transition-transform md:translate-x-0 md:static md:inset-auto md:flex
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo and Close button */}
        <div className="flex items-center justify-between h-16 px-4 bg-slate-900">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-white" />
            <span className="text-xl font-semibold">Guardião</span>
          </div>
          <button 
            onClick={() => setOpen(false)} 
            className="md:hidden text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Navigation Links */}
        <div className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {/* Company Selector */}
          {companies.length > 0 && (
            <div className="px-3 py-2 mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-1">Empresa Atual</label>
              <div className="w-full bg-slate-700 text-white py-2 px-3 rounded border border-slate-600">
                {currentCompany?.name || "Selecione uma empresa"}
              </div>
            </div>
          )}
          
          {/* Navigation Items */}
          {navItems.map((item) => (
            <div key={item.path}>
              <Link
                href={item.path}
                onClick={() => setOpen(false)}
                className={`flex items-center px-4 py-2 text-sm rounded-md cursor-pointer ${
                  currentPath === item.path
                    ? "bg-blue-700"
                    : "hover:bg-slate-700"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            </div>
          ))}
        </div>
        
        {/* User Profile */}
        <div className="px-4 py-3 bg-slate-900">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-slate-800 font-semibold">
                {user?.name?.split(" ").map(n => n[0]).join("").toUpperCase() || "U"}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.name || "Usuario"}
              </p>
              <p className="text-xs text-slate-300 truncate">
                {user?.email || "usuario@exemplo.com"}
              </p>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => {
                  const sidebarMenu = document.getElementById("sidebar-menu");
                  if (sidebarMenu) {
                    sidebarMenu.classList.toggle("hidden");
                  }
                }}
              >
                <ChevronDown className="h-5 w-5 text-slate-300" />
              </button>
              
              {/* Menu do usuário */}
              <div id="sidebar-menu" className="hidden absolute right-0 bottom-full mb-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                <p className="px-4 py-2 text-sm text-gray-700 font-semibold border-b">{user?.name || "Usuário"}</p>
                <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Perfil</Link>
                <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Configurações</Link>
                {(user?.role === 'admin' || user?.role === 'super_admin') && (
                  <Link href="/admin/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Painel Admin</Link>
                )}
                <div className="border-t my-1"></div>
                <button 
                  onClick={() => {
                    const logoutFn = document.querySelector('[data-logout]') as HTMLElement;
                    if (logoutFn) logoutFn.click();
                  }} 
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
