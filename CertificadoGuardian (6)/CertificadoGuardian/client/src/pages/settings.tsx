import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface SettingsState {
  notifications: {
    notify30: boolean;
    notify15: boolean;
    notify7: boolean;
    notify1: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: string;
    detailedLogs: boolean;
  };
  backup: {
    autoBackup: boolean;
    encryption: boolean;
  };
}

export default function Settings() {
  const { toast } = useToast();
  
  // Settings state
  const [settings, setSettings] = useState<SettingsState>({
    notifications: {
      notify30: true,
      notify15: true,
      notify7: true,
      notify1: true,
    },
    security: {
      twoFactorAuth: true,
      sessionTimeout: "1 hora",
      detailedLogs: true,
    },
    backup: {
      autoBackup: true,
      encryption: true,
    },
  });

  // Handle toggling boolean settings
  const toggleSetting = (
    category: keyof SettingsState,
    setting: string
  ) => {
    setSettings({
      ...settings,
      [category]: {
        ...(settings[category] as any),
        [setting]: !(settings[category] as any)[setting],
      },
    });
  };

  // Handle changing select inputs
  const handleSelectChange = (
    category: keyof SettingsState,
    setting: string,
    value: string
  ) => {
    setSettings({
      ...settings,
      [category]: {
        ...(settings[category] as any),
        [setting]: value,
      },
    });
  };

  // Handle save settings
  const handleSaveSettings = () => {
    toast({
      title: "Configurações salvas",
      description: "Suas configurações foram atualizadas com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Configurações</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-medium text-slate-800">Configurações Gerais</h2>
        </div>
        <div className="p-6 space-y-6">
          {/* Notification Settings */}
          <div>
            <h3 className="text-base font-medium text-slate-800 mb-4">Notificações de Vencimento</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-slate-700">Notificar 30 dias antes</span>
                  <p className="text-xs text-slate-500 mt-1">Enviar e-mail e notificação no sistema</p>
                </div>
                <Switch 
                  checked={settings.notifications.notify30} 
                  onCheckedChange={() => toggleSetting("notifications", "notify30")} 
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-slate-700">Notificar 15 dias antes</span>
                  <p className="text-xs text-slate-500 mt-1">Enviar e-mail, WhatsApp e notificação no sistema</p>
                </div>
                <Switch 
                  checked={settings.notifications.notify15} 
                  onCheckedChange={() => toggleSetting("notifications", "notify15")} 
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-slate-700">Notificar 7 dias antes</span>
                  <p className="text-xs text-slate-500 mt-1">Enviar e-mail, WhatsApp e notificação no sistema</p>
                </div>
                <Switch 
                  checked={settings.notifications.notify7} 
                  onCheckedChange={() => toggleSetting("notifications", "notify7")} 
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-slate-700">Notificar 1 dia antes</span>
                  <p className="text-xs text-slate-500 mt-1">Enviar e-mail, WhatsApp e notificação no sistema</p>
                </div>
                <Switch 
                  checked={settings.notifications.notify1} 
                  onCheckedChange={() => toggleSetting("notifications", "notify1")} 
                />
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-slate-200">
            <h3 className="text-base font-medium text-slate-800 mb-4">Configurações de Segurança</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-slate-700">Autenticação de dois fatores (2FA)</span>
                  <p className="text-xs text-slate-500 mt-1">Exigir 2FA para todos os usuários</p>
                </div>
                <Switch 
                  checked={settings.security.twoFactorAuth} 
                  onCheckedChange={() => toggleSetting("security", "twoFactorAuth")} 
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-slate-700">Tempo de expiração da sessão</span>
                  <p className="text-xs text-slate-500 mt-1">Encerrar sessão após inatividade</p>
                </div>
                <Select 
                  value={settings.security.sessionTimeout} 
                  onValueChange={(value) => handleSelectChange("security", "sessionTimeout", value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15 minutos">15 minutos</SelectItem>
                    <SelectItem value="30 minutos">30 minutos</SelectItem>
                    <SelectItem value="1 hora">1 hora</SelectItem>
                    <SelectItem value="4 horas">4 horas</SelectItem>
                    <SelectItem value="8 horas">8 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-slate-700">Registro detalhado de atividades</span>
                  <p className="text-xs text-slate-500 mt-1">Mantém logs detalhados de todas as ações</p>
                </div>
                <Switch 
                  checked={settings.security.detailedLogs} 
                  onCheckedChange={() => toggleSetting("security", "detailedLogs")} 
                />
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-slate-200">
            <h3 className="text-base font-medium text-slate-800 mb-4">Backup e Armazenamento</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-slate-700">Backup automático diário</span>
                  <p className="text-xs text-slate-500 mt-1">Realizar backup de todos os certificados</p>
                </div>
                <Switch 
                  checked={settings.backup.autoBackup} 
                  onCheckedChange={() => toggleSetting("backup", "autoBackup")} 
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-slate-700">Criptografia avançada</span>
                  <p className="text-xs text-slate-500 mt-1">Usar criptografia AES-256 para todos os dados</p>
                </div>
                <Switch 
                  checked={settings.backup.encryption} 
                  onCheckedChange={() => toggleSetting("backup", "encryption")} 
                />
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 text-right">
          <Button onClick={handleSaveSettings}>
            Salvar Configurações
          </Button>
        </div>
      </div>
    </div>
  );
}
