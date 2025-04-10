import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { PlusCircle, FilePenLine, Trash2, UserCheck, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// User type
interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  role: string;
  status: string;
  permissions?: {
    view: boolean;
    edit: boolean;
    delete: boolean;
    viewPassword: boolean;
  };
}

export default function Users() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  
  // State for dialogs
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    role: "",
    status: ""
  });

  // Get users (admin only)
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await fetch("/api/users", {
        credentials: "include",
      });
      
      if (res.status === 403) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para visualizar usuários.",
          variant: "destructive",
        });
        return [];
      }
      
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: currentUser?.role === "admin",
  });
  
  // Update user mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: number, userData: Partial<User> }) => {
      const res = await apiRequest("PATCH", `/api/users/${data.id}`, data.userData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditDialogOpen(false);
      toast({
        title: "Usuário atualizado",
        description: "As informações do usuário foram atualizadas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message || "Ocorreu um erro ao atualizar o usuário.",
        variant: "destructive",
      });
    }
  });
  
  // Update user status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (data: { id: number, status: string }) => {
      const res = await apiRequest("PATCH", `/api/users/${data.id}/status`, { status: data.status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Status atualizado",
        description: "O status do usuário foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message || "Ocorreu um erro ao atualizar o status do usuário.",
        variant: "destructive",
      });
    }
  });
  
  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setDeleteDialogOpen(false);
      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message || "Ocorreu um erro ao excluir o usuário.",
        variant: "destructive",
      });
    }
  });

  // Handle edit button click
  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    });
    setEditDialogOpen(true);
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle form submission
  const handleUpdateUser = () => {
    if (!selectedUser) return;
    
    updateMutation.mutate({
      id: selectedUser.id,
      userData: editFormData
    });
  };
  
  // Handle status toggle
  const handleToggleStatus = (user: User) => {
    const newStatus = user.status === "active" ? "inactive" : "active";
    updateStatusMutation.mutate({
      id: user.id,
      status: newStatus
    });
  };
  
  // Handle delete button click
  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };
  
  // Handle delete confirmation
  const handleConfirmDelete = () => {
    if (!selectedUser) return;
    deleteMutation.mutate(selectedUser.id);
  };
  
  // Placeholder function for adding new user (to be implemented)
  const handleAddUser = () => {
    toast({
      title: "Função não implementada",
      description: "Adição de usuários será disponibilizada em breve.",
    });
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-800">Gerenciamento de Usuários</h1>
          <Button onClick={handleAddUser}>
            <PlusCircle className="h-5 w-5 mr-2" />
            Adicionar Usuário
          </Button>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (currentUser?.role !== "admin") ? (
              <div className="p-8 text-center">
                <h3 className="text-lg font-medium text-slate-600">Acesso Restrito</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Apenas administradores podem gerenciar usuários do sistema.
                </p>
              </div>
            ) : users && users.length > 0 ? (
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Função
                    </th>
                    <th className="px-6 py-3 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Permissões
                    </th>
                    <th className="px-6 py-3 bg-slate-50 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {users.map((user) => (
                    <tr key={user.id} className={user.status === "inactive" ? "bg-slate-50" : ""}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`h-10 w-10 flex-shrink-0 rounded-full ${user.status === "active" ? "bg-slate-200" : "bg-slate-300"} flex items-center justify-center text-slate-600 font-semibold`}>
                            {user.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-800">
                              {user.name}
                              {user.status === "inactive" && (
                                <Badge variant="outline" className="ml-2 text-xs py-0 bg-slate-100">Inativo</Badge>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-800">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-800">{user.role === "admin" ? "Administrador" : "Usuário"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {user.permissions?.view && (
                            <span className="px-2 py-1 text-xs rounded bg-slate-100 text-slate-800">Visualizar</span>
                          )}
                          {user.permissions?.edit && (
                            <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">Editar</span>
                          )}
                          {user.permissions?.delete && (
                            <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800">Excluir</span>
                          )}
                          {user.permissions?.viewPassword && (
                            <span className="px-2 py-1 text-xs rounded bg-amber-100 text-amber-800">Ver Senha</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            title={user.status === "active" ? "Desativar usuário" : "Ativar usuário"}
                            onClick={() => handleToggleStatus(user)}
                            disabled={updateStatusMutation.isPending}
                          >
                            {user.status === "active" ? (
                              <UserX className="h-5 w-5 text-amber-600" />
                            ) : (
                              <UserCheck className="h-5 w-5 text-success-600" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Editar usuário"
                            onClick={() => handleEditClick(user)}
                            disabled={updateMutation.isPending}
                          >
                            <FilePenLine className="h-5 w-5 text-slate-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Excluir usuário"
                            onClick={() => handleDeleteClick(user)}
                            disabled={deleteMutation.isPending || user.id === currentUser?.id}
                          >
                            <Trash2 className="h-5 w-5 text-danger-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center">
                <h3 className="text-lg font-medium text-slate-600">Nenhum usuário encontrado</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Adicione novos usuários para que eles possam acessar o sistema.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário. Alterações serão aplicadas imediatamente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                value={editFormData.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={editFormData.email}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Função</Label>
              <Select
                value={editFormData.role}
                onValueChange={(value) => handleSelectChange("role", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="user">Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={editFormData.status}
                onValueChange={(value) => handleSelectChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleUpdateUser}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a conta do usuário
              {selectedUser && <span className="font-semibold"> {selectedUser.name}</span>} e todas as suas informações.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-danger hover:bg-danger/90"
            >
              {deleteMutation.isPending ? "Excluindo..." : "Sim, excluir usuário"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
