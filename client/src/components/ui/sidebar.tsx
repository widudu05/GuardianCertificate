import { useState } from "react";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  FileText, 
  Building2, 
  Users, 
  History, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck
} from "lucide-react";

type SidebarLink = {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
};

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = user?.role === "admin";

  const links: SidebarLink[] = [
    {
      href: "/",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      href: "/certificates",
      label: "Certificados",
      icon: <FileText className="h-5 w-5" />
    },
    {
      href: "/companies",
      label: "Empresas",
      icon: <Building2 className="h-5 w-5" />
    },
    {
      href: "/users",
      label: "Usuários",
      icon: <Users className="h-5 w-5" />,
      adminOnly: true
    },
    {
      href: "/logs",
      label: "Logs de Atividade",
      icon: <History className="h-5 w-5" />,
      adminOnly: true
    },
    {
      href: "/settings",
      label: "Configurações",
      icon: <Settings className="h-5 w-5" />
    }
  ];

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <aside className={cn(
      "bg-white border-r border-gray-200 h-screen transition-all duration-300 ease-in-out",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex items-center justify-between h-16 border-b border-gray-200 px-4">
        <div className={cn("flex items-center space-x-2", collapsed && "justify-center w-full")}>
          <span className="bg-primary-600 text-white p-1.5 rounded-md">
            <ShieldCheck className="h-5 w-5" />
          </span>
          {!collapsed && <span className="font-semibold text-primary-600">Guardião</span>}
        </div>
        <button
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
          onClick={toggleSidebar}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
      
      <div className={cn("px-3 py-4", collapsed && "px-2")}>
        {!collapsed && (
          <div className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-gray-500">
            Menu Principal
          </div>
        )}
        <nav className="space-y-1">
          {links.map((link) => {
            if (link.adminOnly && !isAdmin) return null;
            
            const isActive = location === link.href;
            
            return (
              <Link 
                key={link.href}

                href={link.href}
              >
                <a
                  className={cn(
                    "flex items-center py-2 rounded-md font-medium transition-colors",
                    isActive 
                      ? "text-primary-600 bg-primary-50 border-l-2 border-primary-600"
                      : "text-gray-600 hover:bg-gray-100 hover:text-primary-600",
                    collapsed ? "justify-center px-2" : "px-3"
                  )}
                >
                  <span className={collapsed ? "mx-0" : "mr-3"}>
                    {link.icon}
                  </span>
                  {!collapsed && <span>{link.label}</span>}
                </a>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
