import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertCompanySchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface CompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Use the schema directly
const formSchema = insertCompanySchema;

type FormValues = z.infer<typeof formSchema>;

export function CompanyDialog({ open, onOpenChange }: CompanyDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      identifier: "",
    },
  });

  const addCompanyMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await apiRequest("POST", "/api/companies", values);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      
      toast({
        title: "Empresa adicionada",
        description: "A empresa foi adicionada com sucesso.",
      });
      
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar empresa",
        description: error.message || "Ocorreu um erro ao adicionar a empresa.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    addCompanyMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-800">Adicionar Empresa</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Empresa</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Empresa ABC Ltda" {...field} />
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
                    <Input placeholder="Digite apenas números" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-6">
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
                disabled={addCompanyMutation.isPending}
              >
                {addCompanyMutation.isPending ? "Adicionando..." : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
