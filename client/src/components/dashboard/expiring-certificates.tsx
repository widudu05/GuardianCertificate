import { 
  Eye, 
  RefreshCw,
  FileText,
  ShieldCheck 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Certificate } from "@/types";
import { getCertificateStatus, getDaysUntilExpiration, formatDate, getStatusBadgeColor, getStatusText, cn } from "@/lib/utils";
import { useLocation } from "wouter";

interface ExpiringCertificatesProps {
  certificates: Certificate[];
  isLoading: boolean;
}

export function ExpiringCertificates({ certificates, isLoading }: ExpiringCertificatesProps) {
  const [_, setLocation] = useLocation();

  function viewCertificate(id: number) {
    setLocation(`/certificates/${id}`);
  }

  return (
    <Card>
      <CardHeader className="px-5 py-4 border-b border-gray-200 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold text-gray-800">Certificados a Vencer</CardTitle>
        <Button
          variant="link"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium p-0"
          onClick={() => setLocation("/certificates?filter=expiring")}
        >
          Ver todos
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Certificado
                </th>
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiração
                </th>
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                Array(4).fill(0).map((_, index) => (
                  <tr key={index}>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="h-5 bg-gray-200 rounded w-32 mb-1 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="h-6 bg-gray-200 rounded w-10 animate-pulse"></div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="h-5 bg-gray-200 rounded w-20 mb-1 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </td>
                  </tr>
                ))
              ) : certificates.length > 0 ? (
                certificates.map((cert) => {
                  const status = getCertificateStatus(cert);
                  const daysLeft = getDaysUntilExpiration(cert.expirationDate);
                  
                  return (
                    <tr key={cert.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{cert.name}</div>
                          <div className="text-xs text-gray-500">{cert.identifier}</div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Badge 
                          variant="outline" 
                          className={cert.type === 'A1' 
                            ? "bg-purple-100 text-purple-800 hover:bg-purple-100" 
                            : "bg-green-100 text-green-800 hover:bg-green-100"
                          }
                        >
                          {cert.type}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(cert.expirationDate)}</div>
                        <div className={daysLeft <= 7 ? "text-xs text-red-600" : "text-xs text-orange-600"}>
                          {daysLeft} dias restantes
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            getStatusBadgeColor(status),
                            "hover:bg-opacity-90"
                          )}
                        >
                          {getStatusText(status)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7 text-gray-500 hover:text-primary-600"
                            onClick={() => viewCertificate(cert.id)}
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7 text-gray-500 hover:text-gray-700"
                            title="Renovar"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <ShieldCheck className="h-8 w-8 text-gray-400 mb-2" />
                      <p>Não há certificados a vencer nos próximos 30 dias.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
