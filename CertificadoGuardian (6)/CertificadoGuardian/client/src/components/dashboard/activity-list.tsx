import { Skeleton } from "@/components/ui/skeleton";
import { 
  Eye, 
  PlusCircle, 
  Edit, 
  RefreshCw, 
  LogIn, 
  Key
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface Activity {
  id: number;
  userId: number;
  userName: string;
  action: string;
  entity: string;
  entityId: number;
  entityName?: string;
  timestamp: string;
}

interface ActivityListProps {
  activities: Activity[];
  isLoading: boolean;
}

export default function ActivityList({
  activities,
  isLoading,
}: ActivityListProps) {
  // Get icon based on action
  const getActionIcon = (action: string) => {
    switch (action) {
      case "view":
        return <Eye className="h-4 w-4 text-primary-600" />;
      case "create":
        return <PlusCircle className="h-4 w-4 text-green-600" />;
      case "update":
        return <Edit className="h-4 w-4 text-blue-600" />;
      case "login":
        return <LogIn className="h-4 w-4 text-indigo-600" />;
      case "view_password":
        return <Key className="h-4 w-4 text-amber-600" />;
      default:
        return <RefreshCw className="h-4 w-4 text-slate-600" />;
    }
  };

  // Get background color based on action
  const getActionBgColor = (action: string) => {
    switch (action) {
      case "view":
        return "bg-primary-100";
      case "create":
        return "bg-green-100";
      case "update":
        return "bg-blue-100";
      case "login":
        return "bg-indigo-100";
      case "view_password":
        return "bg-amber-100";
      default:
        return "bg-slate-100";
    }
  };

  // Format action text
  const formatAction = (action: string, entity: string, entityName?: string) => {
    switch (action) {
      case "view":
        return `visualizou ${entity}${entityName ? ` "${entityName}"` : ''}`;
      case "create":
        return `cadastrou ${entity}${entityName ? ` "${entityName}"` : ''}`;
      case "update":
        return `atualizou ${entity}${entityName ? ` "${entityName}"` : ''}`;
      case "login":
        return "acessou o sistema";
      case "view_password":
        return `visualizou a senha de ${entity}${entityName ? ` "${entityName}"` : ''}`;
      default:
        return `${action} ${entity}${entityName ? ` "${entityName}"` : ''}`;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = parseISO(timestamp);
      return format(date, "dd/MM/yyyy, HH:mm");
    } catch (error) {
      return timestamp;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex space-x-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
        <div className="flex space-x-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
        <div className="flex space-x-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-slate-600">Nenhuma atividade recente</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {activities.map((activity) => (
        <div key={activity.id} className="flex space-x-3">
          <div className="flex-shrink-0">
            <div className={`h-8 w-8 rounded-full ${getActionBgColor(activity.action)} flex items-center justify-center`}>
              {getActionIcon(activity.action)}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-800">
              <span className="font-medium">{activity.userName || `Usuário #${activity.userId}`}</span>{" "}
              {formatAction(activity.action, activity.entity, activity.entityName)}
            </p>
            <p className="text-xs text-slate-500">
              {formatTimestamp(activity.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
