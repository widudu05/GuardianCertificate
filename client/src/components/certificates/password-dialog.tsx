import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Certificate, CertificatePasswordResponse } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Check, Clock, Clipboard, EyeOff, Eye } from "lucide-react";
import { getRandomOTPCode } from "@/lib/utils";

interface PasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificate?: Certificate;
}

export function PasswordDialog({ open, onOpenChange, certificate }: PasswordDialogProps) {
  const [step, setStep] = useState<"verification" | "display">("verification");
  const [authCode, setAuthCode] = useState("");
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [timeLeft, setTimeLeft] = useState("5:00");
  const { toast } = useToast();

  // Mock sending 2FA code - in a real app this would be a request to your backend
  const sendVerificationCode = () => {
    const code = getRandomOTPCode();
    // In a real app, this would be sent to the user
    console.log("2FA Code:", code);
    toast({
      title: "Código 2FA enviado",
      description: "Um código de verificação foi enviado para seu email/telefone.",
    });
    
    // In this demo, we'll auto-fill it for simplicity
    setAuthCode("123456");
  };

  // Reset the dialog state when opened/closed
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setStep("verification");
      setAuthCode("");
      setPassword("");
      setCopied(false);
      setShowPassword(false);
    } else {
      // Send verification code when dialog is opened
      sendVerificationCode();
    }
    onOpenChange(isOpen);
  };

  const verifyCodeMutation = useMutation({
    mutationFn: async () => {
      if (!certificate) throw new Error("Certificate is undefined");
      
      const res = await apiRequest(
        "GET", 
        `/api/certificates/${certificate.id}/password?authCode=${authCode}`
      );
      return await res.json() as CertificatePasswordResponse;
    },
    onSuccess: (data) => {
      setPassword(data.password);
      setStep("display");
    },
    onError: (error) => {
      toast({
        title: "Erro de verificação",
        description: "Código inválido ou expirado. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === "verification" ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-gray-800">
                Autenticação 2FA
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-gray-600 mb-4">
                Para visualizar a senha do certificado, informe o código de autenticação enviado para seu e-mail ou telefone.
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="auth-code">Código de Autenticação</Label>
                <Input
                  id="auth-code"
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  placeholder="Digite o código recebido"
                  className="w-full"
                />
                <p className="mt-2 text-sm text-gray-500 flex items-center">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  Código válido por mais <span className="font-medium ml-1">{timeLeft}</span>
                </p>
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={sendVerificationCode}
              >
                Reenviar código
              </Button>
              <Button
                type="button"
                onClick={() => verifyCodeMutation.mutate()}
                disabled={!authCode || verifyCodeMutation.isPending}
              >
                {verifyCodeMutation.isPending ? "Verificando..." : "Verificar"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-gray-800">
                Senha do Certificado
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="mb-4">
                <Label className="text-sm font-medium text-gray-500">Certificado</Label>
                <p className="text-gray-800 font-medium">{certificate?.name}</p>
              </div>
              
              <div className="mb-6">
                <Label htmlFor="certificate-password" className="text-sm font-medium text-gray-500">
                  Senha
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="relative flex-1">
                    <Input 
                      id="certificate-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      readOnly
                      className="pr-10 bg-gray-50 font-mono"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-10"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopyToClipboard}
                    className="h-10 w-10"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="mt-2 text-sm text-gray-500 flex items-center">
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  Esta ação foi registrada no log de atividades
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                onClick={() => handleOpenChange(false)}
              >
                Fechar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
