import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertCertificateSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, Upload } from "lucide-react";
import { Company } from "@/types";

interface CertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Extend the schema for client-side validation
const formSchema = insertCertificateSchema.extend({
  passwordConfirm: z.string().min(1, "Confirmação de senha é obrigatória"),
}).refine(data => data.password === data.passwordConfirm, {
  message: "As senhas não coincidem",
  path: ["passwordConfirm"],
});

type FormValues = z.infer<typeof formSchema>;

export function CertificateDialog({ open, onOpenChange }: CertificateDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch companies for select dropdown
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
    enabled: open,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      entity: "",
      identifier: "",
      type: "A1",
      companyId: "",
      issuedDate: new Date().toISOString().split("T")[0],
      expirationDate: "",
      password: "",
      passwordConfirm: "",
      filePath: "",
    },
  });

  const addCertificateMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Remove passwordConfirm before sending to server
      const { passwordConfirm, ...certificateData } = values;
      
      // Convert string ID to number
      certificateData.companyId = parseInt(certificateData.companyId as any);
      
      const res = await apiRequest("POST", "/api/certificates", certificateData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      toast({
        title: "Certificado adicionado",
        description: "O certificado foi adicionado com sucesso.",
      });
      
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar certificado",
        description: error.message || "Ocorreu um erro ao adicionar o certificado.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    addCertificateMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-800">Adicionar Certificado</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome/Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: eCNPJ A1 - Empresa ABC" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="entity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Entidade</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da Empresa/Pessoa" {...field} />
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
                  <FormLabel>CPF/CNPJ</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite apenas números" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Certificado</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
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
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a empresa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id.toString()}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <FormLabel>Data de Expiração</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha do Certificado</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Senha segura do certificado" 
                          {...field} 
                        />
                      </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="passwordConfirm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha</FormLabel>
                    <FormControl>
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Confirme a senha do certificado" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="filePath"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Arquivo do Certificado</FormLabel>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none">
                          <span>Selecione o arquivo</span>
                          <input 
                            id="file-upload" 
                            name="file-upload" 
                            type="file" 
                            className="sr-only"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // In a real app, this would upload the file and set the path
                                field.onChange(`/uploads/${file.name}`);
                              }
                            }}
                          />
                        </label>
                        <p className="pl-1">ou arraste e solte</p>
                      </div>
                      <p className="text-xs text-gray-500">PFX, P12 ou outros formatos suportados</p>
                      {field.value && (
                        <p className="text-xs text-green-600">Arquivo selecionado: {field.value.split('/').pop()}</p>
                      )}
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-6 flex items-center justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={addCertificateMutation.isPending}
              >
                {addCertificateMutation.isPending ? "Adicionando..." : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
