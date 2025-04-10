import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Eye, EyeOff, Copy, Shield } from "lucide-react";
import { format } from "date-fns";

interface Certificate {
  id: number;
  name: string;
  entity: string;
  identifier: string;
  type: string;
  issuedDate: string;
  expirationDate: string;
}

interface ViewPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificate: Certificate | null;
}

export default function ViewPasswordDialog({
  open,
  onOpenChange,
  certificate,
}: ViewPasswordDialogProps) {
  const { toast } = useToast();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [password, setPassword] = useState("");

  // Clear password when dialog closes
  useEffect(() => {
    if (!open) {
      setPassword("");
      setPasswordVisible(false);
    }
  }, [open]);

  // Fetch certificate password
  const fetchPasswordMutation = useMutation({
    mutationFn: async () => {
      if (!certificate) throw new Error("Certificado não encontrado");
      
      const res = await apiRequest(
        "POST",
        `/api/certificates/${certificate.id}/password`,
        {}
      );
      return res.json();
    },
    onSuccess: (data) => {
      setPassword(data.password);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao buscar senha",
        description: error.message,
        variant: "destructive",
      });
      onOpenChange(false);
    },
  });

  // Copy password to clipboard
  const copyPassword = () => {
    navigator.clipboard.writeText(password);
    toast({
      title: "Senha copiada",
      description: "A senha foi copiada para a área de transferência.",
    });
  };

  // Fetch password when dialog opens
  useEffect(() => {
    if (open && certificate && !password) {
      fetchPasswordMutation.mutate();
    }
  }, [open, certificate]);

  if (!certificate) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-primary-600" />
            Senha do Certificado
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="text-sm text-slate-600">
            <div className="grid grid-cols-3 gap-2 mb-1">
              <span className="font-medium">Certificado:</span>
              <span className="col-span-2">{certificate.name}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-1">
              <span className="font-medium">Entidade:</span>
              <span className="col-span-2">{certificate.entity}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-1">
              <span className="font-medium">CNPJ/CPF:</span>
              <span className="col-span-2">{certificate.identifier}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-1">
              <span className="font-medium">Validade:</span>
              <span className="col-span-2">
                {certificate.expirationDate 
                  ? format(new Date(certificate.expirationDate), "dd/MM/yyyy")
                  : "Não informada"}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="cert-password-view" className="block text-sm font-medium text-slate-700">
              Senha do Certificado
            </label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Input
                  id="cert-password-view"
                  type={passwordVisible ? "text" : "password"}
                  value={fetchPasswordMutation.isPending ? "Carregando..." : password}
                  readOnly
                  className="pr-10 bg-slate-50"
                  disabled={fetchPasswordMutation.isPending}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  disabled={fetchPasswordMutation.isPending}
                >
                  {passwordVisible ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={copyPassword}
                disabled={fetchPasswordMutation.isPending || !password}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Este acesso será registrado no log de auditoria do sistema.
            </p>
          </div>
        </div>

        <DialogFooter className="sm:justify-end">
          {fetchPasswordMutation.isPending ? (
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Carregando...
            </Button>
          ) : (
            <Button type="button" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
