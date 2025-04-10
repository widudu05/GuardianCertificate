import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Search, Pencil, Trash2, Shield, UserPlus, ShieldAlert } from "lucide-react";
import { AppLayout } from "@/layouts/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User } from "@/types";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
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

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  
  // Fetch users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const filteredUsers = users.filter((user) => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso.",
      });
      setDeleteUserId(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message || "Ocorreu um erro ao excluir o usuário.",
        variant: "destructive",
      });
    }
  });

  const handleDelete = (userId: number) => {
    // Don't allow deleting your own account
    if (userId === currentUser?.id) {
      toast({
        title: "Operação não permitida",
        description: "Você não pode excluir sua própria conta.",
        variant: "destructive",
      });
      return;
    }
    setDeleteUserId(userId);
  };
  
  const confirmDelete = () => {
    if (deleteUserId !== null) {
      deleteUserMutation.mutate(deleteUserId);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Administrador</Badge>;
      case "manager":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Gerente</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Usuário</Badge>;
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "username",
      header: "Usuário",
    },
    {
      accessorKey: "role",
      header: "Função",
      cell: ({ row }) => getRoleBadge(row.getValue("role") as string),
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const user = row.original;
        const isCurrentUser = user.id === currentUser?.id;
        
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
              className="h-8 w-8 text-gray-500 hover:text-purple-600"
              title="Permissões"
            >
              <Shield className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 text-gray-500 hover:text-red-600"
              title="Excluir"
              onClick={() => handleDelete(user.id)}
              disabled={isCurrentUser}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  // Only admins should see this page
  if (currentUser?.role !== 'admin') {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full py-16">
          <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Acesso Restrito</h1>
          <p className="text-gray-600 mb-6 text-center max-w-md">
            Você não tem permissão para acessar esta página. Apenas administradores podem gerenciar usuários.
          </p>
          <Button onClick={() => window.history.back()}>Voltar</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Usuários</h1>
        <p className="mt-1 text-gray-600">Gerencie os usuários do sistema</p>
      </div>
      
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Buscar usuários..."
            className="pl-10 max-w-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" /> Adicionar Usuário
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-0 overflow-hidden">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredUsers.length > 0 ? (
            <DataTable 
              columns={columns} 
              data={filteredUsers} 
            />
          ) : (
            <div className="p-8 text-center text-gray-500">
              <div className="flex flex-col items-center">
                <Users className="h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-medium mb-1">Nenhum usuário encontrado</h3>
                <p className="mb-4">Adicione um novo usuário para começar.</p>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" /> Adicionar Usuário
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={deleteUserId !== null} 
        onOpenChange={(open) => !open && setDeleteUserId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteUserMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
