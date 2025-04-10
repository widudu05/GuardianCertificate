import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

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

interface LogDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: LogEntry | null;
}

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

export default function LogDetailsDialog({
  open,
  onOpenChange,
  log,
}: LogDetailsDialogProps) {
  if (!log) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Detalhes do Log</DialogTitle>
          <DialogDescription>
            Informações completas do registro de atividade.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1 font-medium">ID:</div>
            <div className="col-span-3">{log.id}</div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1 font-medium">Data/Hora:</div>
            <div className="col-span-3">
              {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss")}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1 font-medium">Usuário:</div>
            <div className="col-span-3">
              {log.userName || `Usuário #${log.userId}`} (ID: {log.userId})
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1 font-medium">Ação:</div>
            <div className="col-span-3">{formatAction(log.action)}</div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1 font-medium">Entidade:</div>
            <div className="col-span-3">
              {log.entityName || log.entity.charAt(0).toUpperCase() + log.entity.slice(1)} 
              (ID: {log.entityId})
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1 font-medium">IP:</div>
            <div className="col-span-3">{log.ipAddress || "Não registrado"}</div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1 font-medium">Detalhes:</div>
            <div className="col-span-3 whitespace-pre-wrap">
              {log.details || "Nenhum detalhe adicional"}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}