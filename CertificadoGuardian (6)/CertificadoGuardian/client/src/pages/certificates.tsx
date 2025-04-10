import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import AddCertificateDialog from "@/components/certificate/add-certificate-dialog";
import ViewPasswordDialog from "@/components/certificate/view-password-dialog";
import TwoFactorDialog from "@/components/certificate/two-factor-dialog";
import { PlusCircle, Key, FilePenLine, Trash2 } from "lucide-react";
import { format } from "date-fns";

// Certificate type
interface Certificate {
  id: number;
  name: string;
  entity: string;
  identifier: string;
  type: string;
  issuedDate: string;
  expirationDate: string;
}

export default function Certificates() {
  const { currentCompany } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const [showAddCertModal, setShowAddCertModal] = useState(false);
  const [showViewPasswordModal, setShowViewPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
    entity: "",
  });

  // Authentication state for password view
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Process URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const filterParam = urlParams.get('filter');
    
    if (filterParam) {
      setFilters(prev => ({
        ...prev,
        status: filterParam
      }));
    }
  }, []);

  // Get certificates for current company
  const { data: certificates, isLoading } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates", currentCompany?.id, filters],
    queryFn: async () => {
      if (!currentCompany) return [];
      
      let url = `/api/certificates?companyId=${currentCompany.id}`;
      if (filters.status && filters.status !== "all") url += `&status=${filters.status}`;
      if (filters.type && filters.type !== "all") url += `&type=${filters.type}`;
      
      const res = await fetch(url, {
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to fetch certificates");
      
      let data = await res.json();
      
      // Client-side filtering by entity
      if (filters.entity) {
        const searchTerm = filters.entity.toLowerCase();
        data = data.filter((cert: Certificate) => 
          cert.entity.toLowerCase().includes(searchTerm) || 
          cert.identifier.toLowerCase().includes(searchTerm)
        );
      }
      
      return data;
    },
    enabled: !!currentCompany,
  });

  // Delete certificate mutation
  const deleteMutation = useMutation({
    mutationFn: async (certificateId: number) => {
      const res = await fetch(`/api/certificates/${certificateId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete certificate");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      toast({
        title: "Certificado excluído",
        description: "O certificado foi excluído com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir certificado",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle 2FA authentication
  const handleAuth2FA = (code: string) => {
    // In a real app, this would verify the 2FA code
    // Here we're just simulating success
    setIsAuthenticated(true);
    setShow2FAModal(false);
    setShowViewPasswordModal(true);
  };

  // Handle certificate delete
  const handleDelete = (certificate: Certificate) => {
    if (confirm(`Tem certeza que deseja excluir o certificado "${certificate.name}"?`)) {
      deleteMutation.mutate(certificate.id);
    }
  };

  // Get certificate status based on expiration date
  const getCertificateStatus = (expirationDate: string) => {
    const expDate = new Date(expirationDate);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return { text: "Vencido", class: "bg-danger-100 text-danger-700" };
    } else if (diffDays <= 30) {
      return { text: "Próximo ao vencimento", class: "bg-warning-100 text-warning-600" };
    } else {
      return { text: "Válido", class: "bg-success-100 text-success-700" };
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-800">Certificados Digitais</h1>
          <Button onClick={() => setShowAddCertModal(true)}>
            <PlusCircle className="h-5 w-5 mr-2" />
            Adicionar Certificado
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="certificate-type" className="block text-sm font-medium text-slate-700 mb-1">
                Tipo
              </label>
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters({...filters, type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="A1">A1</SelectItem>
                  <SelectItem value="A3">A3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="certificate-status" className="block text-sm font-medium text-slate-700 mb-1">
                Status
              </label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({...filters, status: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="valid">Válidos</SelectItem>
                  <SelectItem value="expiring">Próximos ao Vencimento</SelectItem>
                  <SelectItem value="expired">Vencidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="certificate-entity" className="block text-sm font-medium text-slate-700 mb-1">
                Entidade
              </label>
              <Input
                placeholder="Nome ou CNPJ/CPF"
                value={filters.entity}
                onChange={(e) => setFilters({...filters, entity: e.target.value})}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setFilters({ type: "all", status: "all", entity: "" })}
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Certificate List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : certificates && certificates.length > 0 ? (
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Certificado
                    </th>
                    <th className="px-6 py-3 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Entidade
                    </th>
                    <th className="px-6 py-3 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Emissão
                    </th>
                    <th className="px-6 py-3 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Vencimento
                    </th>
                    <th className="px-6 py-3 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 bg-slate-50 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {certificates.map((certificate) => {
                    const status = getCertificateStatus(certificate.expirationDate);
                    return (
                      <tr key={certificate.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-800">{certificate.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-800">{certificate.entity}</div>
                          <div className="text-xs text-slate-500">{certificate.identifier}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-800">{certificate.type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-800">
                            {format(new Date(certificate.issuedDate), "dd/MM/yyyy")}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-800">
                            {format(new Date(certificate.expirationDate), "dd/MM/yyyy")}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status.class}`}>
                            {status.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedCertificate(certificate);
                                setShow2FAModal(true);
                              }}
                            >
                              <Key className="h-5 w-5 text-primary-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                // In a real app, this would open an edit modal
                                toast({
                                  title: "Função não implementada",
                                  description: "Edição de certificados será disponibilizada em breve.",
                                });
                              }}
                            >
                              <FilePenLine className="h-5 w-5 text-slate-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(certificate)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-5 w-5 text-danger-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center">
                <h3 className="text-lg font-medium text-slate-600">Nenhum certificado encontrado</h3>
                <p className="mt-2 text-sm text-slate-500">
                  {currentCompany
                    ? "Adicione seu primeiro certificado digital clicando no botão acima."
                    : "Selecione uma empresa para visualizar seus certificados."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Certificate Modal */}
      <AddCertificateDialog 
        open={showAddCertModal} 
        onOpenChange={setShowAddCertModal} 
        companyId={currentCompany?.id}
      />

      {/* 2FA Authentication Modal */}
      <TwoFactorDialog
        open={show2FAModal}
        onOpenChange={setShow2FAModal}
        onAuthenticate={handleAuth2FA}
      />

      {/* View Certificate Password Modal */}
      <ViewPasswordDialog
        open={showViewPasswordModal && isAuthenticated}
        onOpenChange={setShowViewPasswordModal}
        certificate={selectedCertificate}
      />
    </>
  );
}
