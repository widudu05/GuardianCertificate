import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Pencil, 
  Trash2, 
  Key,
  ShieldCheck
} from "lucide-react";
import { AppLayout } from "@/layouts/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CertificateDialog } from "@/components/certificates/certificate-dialog";
import { PasswordDialog } from "@/components/certificates/password-dialog";
import { Certificate } from "@/types";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { getStatusBadgeColor, getStatusText, getCertificateStatus, formatDate, getDaysUntilExpiration } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function CertificatesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | undefined>(undefined);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  
  // Fetch certificates
  const { data: certificates = [], isLoading } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates"],
  });

  const filteredCertificates = certificates.filter((cert) => 
    cert.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    cert.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.identifier.includes(searchTerm)
  );

  const viewPassword = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setIsPasswordDialogOpen(true);
  };

  const columns: ColumnDef<Certificate>[] = [
    {
      accessorKey: "name",
      header: "Certificado",
      cell: ({ row }) => {
        const cert = row.original;
        return (
          <div>
            <div className="font-medium">{cert.name}</div>
            <div className="text-sm text-gray-500">{cert.entity}</div>
            <div className="text-xs text-gray-400">{cert.identifier}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        return (
          <Badge 
            variant="outline" 
            className={type === 'A1' 
              ? "bg-purple-100 text-purple-800 hover:bg-purple-100" 
              : "bg-green-100 text-green-800 hover:bg-green-100"
            }
          >
            {type}
          </Badge>
        );
      },
    },
    {
      accessorKey: "expirationDate",
      header: "Expiração",
      cell: ({ row }) => {
        const date = row.getValue("expirationDate") as string;
        const daysLeft = getDaysUntilExpiration(date);
        
        return (
          <div>
            <div>{formatDate(date)}</div>
            <div className={daysLeft <= 7 ? "text-xs text-red-600" : "text-xs text-gray-500"}>
              {daysLeft < 0 ? "Expirado" : `${daysLeft} dias restantes`}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = getCertificateStatus(row.original);
        
        return (
          <Badge 
            variant="outline" 
            className={cn(
              getStatusBadgeColor(status),
              "hover:bg-opacity-90"
            )}
          >
            {getStatusText(status)}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const certificate = row.original;
        
        return (
          <div className="flex space-x-2">
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 text-gray-500 hover:text-primary-600"
              title="Visualizar"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 text-gray-500 hover:text-purple-600"
              title="Ver senha"
              onClick={() => viewPassword(certificate)}
            >
              <Key className="h-4 w-4" />
            </Button>
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
        <h1 className="text-2xl font-semibold text-gray-800">Certificados Digitais</h1>
        <p className="mt-1 text-gray-600">Gerencie seus certificados digitais A1 e A3</p>
      </div>
      
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Buscar certificados..."
            className="pl-10 max-w-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" /> Filtros
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Adicionar Certificado
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0 overflow-hidden">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredCertificates.length > 0 ? (
            <DataTable 
              columns={columns} 
              data={filteredCertificates} 
            />
          ) : (
            <div className="p-8 text-center text-gray-500">
              <div className="flex flex-col items-center">
                <ShieldCheck className="h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-medium mb-1">Nenhum certificado encontrado</h3>
                <p className="mb-4">Adicione seu primeiro certificado digital para começar.</p>
                <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" /> Adicionar Certificado
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Add Certificate Dialog */}
      <CertificateDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen} 
      />
      
      {/* Password Dialog */}
      <PasswordDialog 
        open={isPasswordDialogOpen} 
        onOpenChange={setIsPasswordDialogOpen} 
        certificate={selectedCertificate}
      />
    </AppLayout>
  );
}
