import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, Search, Pencil, Trash2, ShieldCheck } from "lucide-react";
import { AppLayout } from "@/layouts/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CompanyDialog } from "@/components/companies/company-dialog";
import { Company } from "@/types";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function CompaniesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteCompanyId, setDeleteCompanyId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch companies
  const { data: companies = [], isLoading } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const filteredCompanies = companies.filter((company) => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    company.identifier.includes(searchTerm)
  );

  const deleteCompanyMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/companies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({
        title: "Empresa excluída",
        description: "A empresa foi excluída com sucesso.",
      });
      setDeleteCompanyId(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir empresa",
        description: error.message || "Ocorreu um erro ao excluir a empresa.",
        variant: "destructive",
      });
    }
  });

  const handleDelete = (companyId: number) => {
    setDeleteCompanyId(companyId);
  };
  
  const confirmDelete = () => {
    if (deleteCompanyId !== null) {
      deleteCompanyMutation.mutate(deleteCompanyId);
    }
  };

  const columns: ColumnDef<Company>[] = [
    {
      accessorKey: "name",
      header: "Nome da Empresa",
    },
    {
      accessorKey: "identifier",
      header: "CNPJ/CPF",
    },
    {
      accessorKey: "createdAt",
      header: "Data de Cadastro",
      cell: ({ row }) => {
        return formatDate(row.getValue("createdAt") as string);
      },
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const company = row.original;
        
        return (
          <div className="flex space-x-2">
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 text-gray-500 hover:text-blue-600"
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 text-gray-500 hover:text-red-600"
              title="Excluir"
              onClick={() => handleDelete(company.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Empresas</h1>
        <p className="mt-1 text-gray-600">Gerencie as empresas do sistema</p>
      </div>
      
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Buscar empresas..."
            className="pl-10 max-w-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Adicionar Empresa
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-0 overflow-hidden">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredCompanies.length > 0 ? (
            <DataTable 
              columns={columns} 
              data={filteredCompanies} 
            />
          ) : (
            <div className="p-8 text-center text-gray-500">
              <div className="flex flex-col items-center">
                <Building2 className="h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-medium mb-1">Nenhuma empresa encontrada</h3>
                <p className="mb-4">Adicione sua primeira empresa para começar.</p>
                <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" /> Adicionar Empresa
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Add Company Dialog */}
      <CompanyDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={deleteCompanyId !== null} 
        onOpenChange={(open) => !open && setDeleteCompanyId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita e todos os certificados associados também serão excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteCompanyMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
