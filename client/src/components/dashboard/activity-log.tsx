import { useState, useEffect } from "react";
import { 
  CircleUser, 
  LogOut,
  Eye, 
  FilePlus2, 
  Trash2, 
  Key, 
  Bell, 
  PenLine,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { formatDateTime } from "@/lib/utils";
import { ActivityLog } from "@/types";

interface ActivityLogListProps {
  logs: ActivityLog[];
  isLoading: boolean;
}

export function ActivityLogList({ logs, isLoading }: ActivityLogListProps) {
  const [_, setLocation] = useLocation();
  
  function getActionIcon(action: string) {
    switch (action) {
      case 'login':
        return <CircleUser className="text-green-600" />;
      case 'logout':
        return <LogOut className="text-blue-600" />;
      case 'view':
        return <Eye className="text-blue-600" />;
      case 'create':
        return <FilePlus2 className="text-green-600" />;
      case 'update':
        return <PenLine className="text-orange-600" />;
      case 'delete':
        return <Trash2 className="text-red-600" />;
      case 'view_password':
        return <Key className="text-purple-600" />;
      default:
        return <Bell className="text-orange-600" />;
    }
  }

  function getActivityMessage(log: ActivityLog): string {
    const userName = log.user?.name || "Usuário";
    
    switch (log.action) {
      case 'login':
        return `${userName} fez login no sistema`;
      case 'logout':
        return `${userName} fez logout do sistema`;
      case 'view':
        if (log.entity === 'certificate') {
          return `${userName} visualizou o certificado ${log.details?.certificateName || ''}`;
        }
        return `${userName} visualizou ${log.entity}`;
      case 'create':
        if (log.entity === 'certificate') {
          return `${userName} adicionou um novo certificado ${log.details?.name || ''}`;
        } else if (log.entity === 'company') {
          return `${userName} adicionou uma nova empresa ${log.details?.name || ''}`;
        } else if (log.entity === 'user') {
          return `${userName} adicionou um novo usuário ${log.details?.name || ''}`;
        }
        return `${userName} criou ${log.entity}`;
      case 'update':
        return `${userName} atualizou ${log.entity} ${log.details?.name || log.details?.certificateName || ''}`;
      case 'delete':
        return `${userName} removeu ${log.entity} ${log.details?.certificateName || log.details?.name || ''}`;
      case 'view_password':
        return `${userName} acessou a senha do certificado ${log.details?.certificateName || ''}`;
      default:
        return `${userName} realizou uma ação no sistema`;
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="px-5 py-4 border-b border-gray-200">
        <CardTitle className="text-base font-semibold text-gray-800">Atividades Recentes</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-y-auto max-h-[430px]">
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            Array(5).fill(0).map((_, index) => (
              <div key={index} className="px-5 py-4">
                <div className="flex items-start">
                  <div className="mr-3 mt-0.5">
                    <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))
          ) : logs.length > 0 ? (
            logs.map((log) => (
              <div key={log.id} className="px-5 py-4">
                <div className="flex items-start">
                  <div className="mr-3 mt-0.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                      {getActionIcon(log.action)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-800">
                      {getActivityMessage(log)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDateTime(log.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-5 py-8 text-center text-gray-500">
              <div className="flex flex-col items-center">
                <ShieldCheck className="h-8 w-8 text-gray-400 mb-2" />
                <p>Não há atividades recentes para exibir.</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="px-5 py-3 bg-gray-50 border-t border-gray-200">
        <Button 
          variant="link" 
          className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium"
          onClick={() => setLocation("/logs")}
        >
          Ver todos os logs
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
