import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History, Search, Calendar, Filter, ShieldAlert } from "lucide-react";
import { AppLayout } from "@/layouts/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActivityLog } from "@/types";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

export default function LogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { user: currentUser } = useAuth();
  
  // Fetch logs
  const { data: logs = [], isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/logs"],
  });

  const filteredLogs = logs.filter((log) => {
    const searchString = searchTerm.toLowerCase();
    const hasUser = log.user?.name?.toLowerCase().includes(searchString) || false;
    const hasAction = log.action?.toLowerCase().includes(searchString) || false;
    const hasEntity = log.entity?.toLowerCase().includes(searchString) || false;
    const hasDetails = JSON.stringify(log.details || {}).toLowerCase().includes(searchString);
    
    return hasUser || hasAction || hasEntity || hasDetails;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case "login":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Login</Badge>;
      case "logout":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Logout</Badge>;
      case "create":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Criação</Badge>;
      case "update":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Atualização</Badge>;
      case "delete":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Exclusão</Badge>;
      case "view":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Visualização</Badge>;
      case "view_password":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Visualizar Senha</Badge>;
      default:
        return <Badge>{action}</Badge>;
    }
  };

  const getEntityText = (entity: string) => {
    switch (entity) {
      case "user":
        return "Usuário";
      case "company":
        return "Empresa";
      case "certificate":
        return "Certificado";
      case "system":
        return "Sistema";
      default:
        return entity;
    }
  };

  const columns: ColumnDef<ActivityLog>[] = [
    {
      accessorKey: "timestamp",
      header: "Data/Hora",
      cell: ({ row }) => formatDateTime(row.getValue("timestamp") as string),
    },
    {
      accessorKey: "userId",
      header: "Usuário",
      cell: ({ row }) => {
        const log = row.original;
        return log.user?.name || "Sistema";
      },
    },
    {
      accessorKey: "action",
      header: "Ação",
      cell: ({ row }) => getActionBadge(row.getValue("action") as string),
    },
    {
      accessorKey: "entity",
      header: "Entidade",
      cell: ({ row }) => getEntityText(row.getValue("entity") as string),
    },
    {
      accessorKey: "details",
      header: "Detalhes",
      cell: ({ row }) => {
        const details = row.original.details;
        if (!details) return "-";
        
        // Format details in a readable way
        const detailsStr = Object.entries(details)
          .map(([key, value]) => {
            // For certain fields, format them in a more readable way
            if (key === "name" || key === "certificateName") {
              return value;
            }
            if (key === "updatedFields" && Array.isArray(value)) {
              return `Campos atualizados: ${value.join(", ")}`;
            }
            return `${key}: ${value}`;
          })
          .join(", ");
        
        return (
          <div className="max-w-xs truncate" title={detailsStr}>
            {detailsStr}
          </div>
        );
      },
    },
    {
      accessorKey: "ipAddress",
      header: "IP",
    },
  ];

  // Only admins should see this page
  if (currentUser?.role !== 'admin') {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full py-16">
          <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Acesso Restrito</h1>
          <p className="text-gray-600 mb-6 text-center max-w-md">
            Você não tem permissão para acessar esta página. Apenas administradores podem visualizar logs de atividade.
          </p>
          <Button onClick={() => window.history.back()}>Voltar</Button>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Logs de Atividade</h1>
        <p className="mt-1 text-gray-600">Histórico de ações realizadas no sistema</p>
      </div>
      
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Buscar logs..."
            className="pl-10 max-w-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" /> Período
          </Button>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" /> Filtros
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0 overflow-hidden">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredLogs.length > 0 ? (
            <DataTable 
              columns={columns} 
              data={filteredLogs} 
              searchColumn="userId"
              searchPlaceholder="Filtrar por usuário..."
            />
          ) : (
            <div className="p-8 text-center text-gray-500">
              <div className="flex flex-col items-center">
                <History className="h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-medium mb-1">Nenhum log encontrado</h3>
                <p>Não há registros de atividade que correspondam aos filtros aplicados.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
