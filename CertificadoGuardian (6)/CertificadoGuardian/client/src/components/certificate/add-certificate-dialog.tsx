import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CloudUpload, Loader2, PlusCircle, X } from "lucide-react";

interface AddCertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId?: number;
}

// Certificate form schema
const certificateFormSchema = z.object({
  name: z.string().min(1, "O nome do certificado é obrigatório"),
  entity: z.string().min(1, "O nome da entidade é obrigatório"),
  identifier: z.string().min(1, "CNPJ/CPF é obrigatório"),
  type: z.string().min(1, "O tipo de certificado é obrigatório"),
  password: z.string().min(1, "A senha do certificado é obrigatória"),
  issuedDate: z.string().min(1, "A data de emissão é obrigatória"),
  expirationDate: z.string().min(1, "A data de vencimento é obrigatória"),
  systems: z.array(
    z.object({
      name: z.string().min(1, "Nome do sistema é obrigatório"),
      url: z.string().optional(),
    })
  ).optional(),
  notes: z.string().optional(),
});

type CertificateFormValues = z.infer<typeof certificateFormSchema>;

export default function AddCertificateDialog({
  open,
  onOpenChange,
  companyId,
}: AddCertificateDialogProps) {
  const { toast } = useToast();
  const [certificateType, setCertificateType] = useState<string>("A1");
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [systems, setSystems] = useState<{ name: string; url: string }[]>([
    { name: "", url: "" },
  ]);

  const form = useForm<CertificateFormValues>({
    resolver: zodResolver(certificateFormSchema),
    defaultValues: {
      name: "",
      entity: "",
      identifier: "",
      type: "A1",
      password: "",
      issuedDate: "",
      expirationDate: "",
      systems: [{ name: "", url: "" }],
      notes: "",
    },
  });

  const addCertificateMutation = useMutation({
    mutationFn: async (values: CertificateFormValues) => {
      if (!companyId) {
        throw new Error("É necessário selecionar uma empresa");
      }

      // In a real app, we would use FormData to handle file uploads
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("entity", values.entity);
      formData.append("identifier", values.identifier);
      formData.append("type", values.type);
      formData.append("password", values.password);
      formData.append("issuedDate", values.issuedDate);
      formData.append("expirationDate", values.expirationDate);
      formData.append("companyId", companyId.toString());
      formData.append("systems", JSON.stringify(values.systems));
      
      if (values.notes) {
        formData.append("notes", values.notes);
      }

      if (certificateFile && values.type === "A1") {
        formData.append("certificateFile", certificateFile);
      }

      const res = await fetch("/api/certificates", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erro ao adicionar certificado");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificates", companyId] });
      toast({
        title: "Certificado adicionado",
        description: "O certificado foi adicionado com sucesso.",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar certificado",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: CertificateFormValues) => {
    if (!companyId) {
      toast({
        title: "Erro",
        description: "É necessário selecionar uma empresa",
        variant: "destructive",
      });
      return;
    }
    
    // Include the systems array in the values
    values.systems = systems.filter(system => system.name.trim() !== "");
    addCertificateMutation.mutate(values);
  };

  const resetForm = () => {
    form.reset();
    setCertificateFile(null);
    setSystems([{ name: "", url: "" }]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCertificateFile(e.target.files[0]);
    }
  };

  const addSystemField = () => {
    setSystems([...systems, { name: "", url: "" }]);
  };

  const updateSystem = (index: number, field: "name" | "url", value: string) => {
    const updatedSystems = [...systems];
    updatedSystems[index][field] = value;
    setSystems(updatedSystems);
  };

  const removeSystem = (index: number) => {
    if (systems.length > 1) {
      const updatedSystems = [...systems];
      updatedSystems.splice(index, 1);
      setSystems(updatedSystems);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Certificado Digital</DialogTitle>
          <DialogDescription>
            Preencha os dados do certificado digital que deseja adicionar ao sistema.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Certificado</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Certificado e-CNPJ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="entity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Entidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Empresa ou Pessoa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ/CPF</FormLabel>
                    <FormControl>
                      <Input placeholder="00.000.000/0000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Certificado</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setCertificateType(value);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="A1">A1</SelectItem>
                        <SelectItem value="A3">A3</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha do Certificado</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Senha segura"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="issuedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Emissão</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expirationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Vencimento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {certificateType === "A1" && (
              <div className="space-y-2">
                <FormLabel>Arquivo do Certificado (.pfx)</FormLabel>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <CloudUpload className="mx-auto h-12 w-12 text-slate-400" />
                    <div className="flex text-sm text-slate-600">
                      <label
                        htmlFor="cert-file"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                      >
                        <span>Selecione o arquivo</span>
                        <Input
                          id="cert-file"
                          type="file"
                          accept=".pfx"
                          className="sr-only"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">ou arraste e solte</p>
                    </div>
                    <p className="text-xs text-slate-500">
                      {certificateFile
                        ? `Arquivo selecionado: ${certificateFile.name}`
                        : "Arquivo .pfx até 10MB"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <FormLabel>Sistemas que utilizam este certificado</FormLabel>
              <div className="space-y-3 mt-1">
                {systems.map((system, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Nome do Sistema"
                        value={system.name}
                        onChange={(e) =>
                          updateSystem(index, "name", e.target.value)
                        }
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        placeholder="URL do Sistema"
                        value={system.url}
                        onChange={(e) =>
                          updateSystem(index, "url", e.target.value)
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSystem(index)}
                      disabled={systems.length === 1}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="text-sm"
                  onClick={addSystemField}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Adicionar outro sistema
                </Button>
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informações adicionais sobre este certificado"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={addCertificateMutation.isPending}
              >
                {addCertificateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Certificado'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
