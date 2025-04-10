import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Loader2, ArrowRight } from "lucide-react";

interface TwoFactorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthenticate: (code: string) => void;
}

export default function TwoFactorDialog({
  open,
  onOpenChange,
  onAuthenticate,
}: TwoFactorDialogProps) {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = () => {
    if (!code) return;

    setIsVerifying(true);
    // Simulate verification delay
    setTimeout(() => {
      onAuthenticate(code);
      setIsVerifying(false);
      setCode("");
    }, 1500);
  };

  const handleClose = () => {
    setCode("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-primary-600" />
            Autenticação de Dois Fatores
          </DialogTitle>
          <DialogDescription>
            Para visualizar a senha do certificado, é necessário confirmar sua identidade com um código de autenticação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <label htmlFor="auth-code" className="block text-sm font-medium text-slate-700">
              Código de Autenticação
            </label>
            <div className="flex space-x-2">
              <Input
                id="auth-code"
                type="text"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="flex-1"
                disabled={isVerifying}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && code.length === 6) {
                    handleVerify();
                  }
                }}
              />
              <Button 
                type="button"
                variant="secondary"
                disabled={code.length !== 6 || isVerifying}
                onClick={() => handleVerify()}
              >
                {isVerifying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              O código foi enviado para seu e-mail e aplicativo autenticador.
            </p>
          </div>

          {/* Guide for 2FA verification */}
          <div className="text-sm text-slate-700 space-y-2 border-t border-slate-200 pt-4">
            <p className="font-medium">Não recebeu o código?</p>
            <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
              <li>Verifique sua caixa de entrada e pastas de spam</li>
              <li>Verifique seu aplicativo autenticador</li>
              <li>
                Aguarde alguns minutos para o envio do código
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isVerifying}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleVerify}
            disabled={code.length !== 6 || isVerifying}
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              "Verificar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
