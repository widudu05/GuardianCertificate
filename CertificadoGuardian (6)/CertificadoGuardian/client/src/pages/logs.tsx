import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Download, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import LogDetailsDialog from "@/components/log/log-details-dialog";
import { format } from "date-fns";

// Log entry type
interface LogEntry {
  id: number;
  userId: number;
  userName: string;
  action: string;
  entity: string;
  entityId: number;
  entityName?: string;
  details: string;
  timestamp: string;
  ipAddress: string;
}

export default function Logs() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    user: "all",
    action: "all",
    date: "",
  });
  
  // Estado para controlar o modal de detalhes
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  // Get activity logs (admin only)
  const { data: logs, isLoading } = useQuery<LogEntry[]>({
    queryKey: ["/api/logs", filters],
    queryFn: async () => {
      let url = "/api/logs";
      const params = new URLSearchParams();
      
      if (filters.user && filters.user !== "all") params.append("userId", filters.user);
      if (filters.action && filters.action !== "all") params.append("action", filters.action);
      if (filters.date) params.append("date", filters.date);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await fetch(url, {
        credentials: "include",
      });
      
      if (res.status === 403) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para visualizar logs.",
          variant: "destructive",
        });
        return [];
      }
      
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    },
    enabled: currentUser?.role === "admin",
  });

  // Format action for display
  const formatAction = (action: string) => {
    switch (action) {
      case "create": return "Cadastro";
      case "update": return "Atualização";
      case "delete": return "Exclusão";
      case "view": return "Visualização";
      case "view_password": return "Visualização de senha";
      case "login": return "Login";
      case "logout": return "Logout";
      case "register": return "Registro";
      default: return action;
    }
  };

  // Handle export
  const handleExport = () => {
    toast({
      title: "Função não implementada",
      description: "Exportação de logs será disponibilizada em breve.",
    });
  };

  // Handle view details
  const handleViewDetails = (log: LogEntry) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-800">Logs e Auditoria</h1>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => setFilters({ user: "all", action: "all", date: "" })}>
              <Filter className="h-5 w-5 mr-2" />
              Limpar Filtros
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-5 w-5 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Log Filters */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="log-user" className="block text-sm font-medium text-slate-700 mb-1">
                Usuário
              </label>
              <Select value={filters.user} onValueChange={(value) => setFilters({...filters, user: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os usuários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os usuários</SelectItem>
                  <SelectItem value="1">Admin Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="log-action" className="block text-sm font-medium text-slate-700 mb-1">
                Ação
              </label>
              <Select value={filters.action} onValueChange={(value) => setFilters({...filters, action: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  <SelectItem value="view">Visualizações</SelectItem>
                  <SelectItem value="create">Cadastros</SelectItem>
                  <SelectItem value="update">Atualizações</SelectItem>
                  <SelectItem value="delete">Exclusões</SelectItem>
                  <SelectItem value="login">Acessos</SelectItem>
                  <SelectItem value="view_password">Visualização de senhas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="log-date" className="block text-sm font-medium text-slate-700 mb-1">
                Data
              </label>
              <Input 
                type="date" 
                id="log-date" 
                value={filters.date}
                onChange={(e) => setFilters({...filters, date: e.target.value})}
              />
            </div>
            <div className="flex items-end">
              <Button className="w-full">Aplicar Filtros</Button>
            </div>
          </div>
        </div>

        {/* Logs List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (currentUser?.role !== "admin") ? (
              <div className="p-8 text-center">
                <h3 className="text-lg font-medium text-slate-600">Acesso Restrito</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Apenas administradores podem visualizar logs do sistema.
                </p>
              </div>
            ) : logs && logs.length > 0 ? (
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Data e Hora
                    </th>
                    <th className="px-6 py-3 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Ação
                    </th>
                    <th className="px-6 py-3 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Entidade
                    </th>
                    <th className="px-6 py-3 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Detalhes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-800">
                          {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-800">{log.userName || `Usuário #${log.userId}`}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-800">{formatAction(log.action)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-800">
                          {log.entityName || log.entity.charAt(0).toUpperCase() + log.entity.slice(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button 
                          variant="link" 
                          className="text-primary-600 p-0 h-auto"
                          onClick={() => handleViewDetails(log)}
                        >
                          <div className="flex items-center">
                            <Info className="h-4 w-4 mr-1" />
                            Ver Detalhes
                          </div>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center">
                <h3 className="text-lg font-medium text-slate-600">Nenhum log encontrado</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Não há registros de atividade correspondentes aos filtros selecionados.
                </p>
              </div>
            )}
          </div>
          
          {/* Pagination (static for now) */}
          {logs && logs.length > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-700">
                    Mostrando <span className="font-medium">1</span> a <span className="font-medium">{logs.length}</span> de <span className="font-medium">{logs.length}</span> resultados
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button 
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                      disabled={true}
                    >
                      <span className="sr-only">Anterior</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-primary-50 text-sm font-medium text-primary-600 hover:bg-blue-50">
                      1
                    </button>
                    <button 
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                      disabled={true}
                    >
                      <span className="sr-only">Próximo</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalhes do log */}
      <LogDetailsDialog 
        open={showDetailsModal} 
        onOpenChange={setShowDetailsModal} 
        log={selectedLog} 
      />
    </>
  );
}