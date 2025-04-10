import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface Certificate {
  id: number;
  name: string;
  entity: string;
  identifier: string;
  type: string;
  issuedDate: string;
  expirationDate: string;
}

interface ExpirationTableProps {
  certificates: Certificate[];
  isLoading: boolean;
}

export default function ExpirationTable({
  certificates,
  isLoading,
}: ExpirationTableProps) {
  // Calculate days until expiration
  const getDaysUntilExpiration = (expirationDate: string) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get status class based on days until expiration
  const getStatusClass = (days: number) => {
    if (days <= 0) {
      return "bg-danger-100 text-danger-600";
    } else if (days <= 30) {
      return "bg-warning-100 text-warning-600";
    } else {
      return "bg-success-100 text-success-600";
    }
  };

  // Get status text based on days until expiration
  const getStatusText = (days: number) => {
    if (days <= 0) {
      return "Vencido";
    } else {
      return `${days} dias`;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-slate-600">Nenhum certificado encontrado</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead>
          <tr>
            <th className="px-4 py-3 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Certificado
            </th>
            <th className="px-4 py-3 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Entidade
            </th>
            <th className="px-4 py-3 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Vencimento
            </th>
            <th className="px-4 py-3 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Dias Restantes
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {certificates.map((certificate) => {
            const daysUntilExpiration = getDaysUntilExpiration(certificate.expirationDate);
            const statusClass = getStatusClass(daysUntilExpiration);
            const statusText = getStatusText(daysUntilExpiration);

            return (
              <tr key={certificate.id}>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`h-8 w-8 flex-shrink-0 ${certificate.type === 'A3' ? 'bg-warning-100 text-warning-600' : 'bg-primary-100 text-primary-600'} rounded-full flex items-center justify-center`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-slate-800">{certificate.name}</div>
                      <div className="text-xs text-slate-500">Tipo {certificate.type}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-slate-800">{certificate.entity}</div>
                  <div className="text-xs text-slate-500">{certificate.identifier}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-slate-800">
                    {format(new Date(certificate.expirationDate), "dd/MM/yyyy")}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
                    {statusText}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
