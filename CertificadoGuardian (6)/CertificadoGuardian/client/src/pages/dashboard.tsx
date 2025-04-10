import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import StatsCard from "@/components/dashboard/stats-card";
import ExpirationTable from "@/components/dashboard/expiration-table";
import ActivityList from "@/components/dashboard/activity-list";
import { FileText, Clock, AlertCircle, ShieldCheck } from "lucide-react";

// Certificate type definition
interface Certificate {
  id: number;
  name: string;
  entity: string;
  identifier: string;
  type: string;
  issuedDate: string;
  expirationDate: string;
}

// Activity log type definition
interface ActivityLog {
  id: number;
  userId: number;
  userName: string;
  action: string;
  entity: string;
  entityId: number;
  entityName?: string;
  timestamp: string;
}

export default function Dashboard() {
  const { currentCompany } = useAuth();
  
  // Get all certificates for current company
  const { data: certificates, isLoading: certificatesLoading } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates", currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany) return [];
      const res = await fetch(`/api/certificates?companyId=${currentCompany.id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch certificates");
      return res.json();
    },
    enabled: !!currentCompany,
  });

  // Get recent activity logs
  const { data: activityLogs, isLoading: logsLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/logs"],
    queryFn: async () => {
      const res = await fetch(`/api/logs?limit=5`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch activity logs");
      return res.json();
    },
  });

  // Calculate stats
  const stats = {
    total: certificates?.length || 0,
    valid: certificates?.filter(cert => {
      const expirationDate = new Date(cert.expirationDate);
      const today = new Date();
      const diffTime = expirationDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 30;
    }).length || 0,
    expiring: certificates?.filter(cert => {
      const expirationDate = new Date(cert.expirationDate);
      const today = new Date();
      const diffTime = expirationDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30 && diffDays > 0;
    }).length || 0,
    expired: certificates?.filter(cert => {
      const expirationDate = new Date(cert.expirationDate);
      const today = new Date();
      const diffTime = expirationDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 0;
    }).length || 0,
  };

  // Get certificates by expiration status for table
  const expiringCertificates = certificates?.filter(cert => {
    const expirationDate = new Date(cert.expirationDate);
    const today = new Date();
    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    // Include all certificates, but we'll sort them by expiration date
    return true;
  }).sort((a, b) => {
    return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
  }).slice(0, 3) || [];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="Total de Certificados" 
          value={stats.total.toString()} 
          icon={<FileText className="h-8 w-8 text-primary-600" />} 
          bgColor="bg-primary-100" 
          isLoading={certificatesLoading}
          filter="all"
        />
        <StatsCard 
          title="Certificados Válidos" 
          value={stats.valid.toString()} 
          icon={<ShieldCheck className="h-8 w-8 text-success-600" />} 
          bgColor="bg-success-100" 
          isLoading={certificatesLoading}
          filter="valid"
        />
        <StatsCard 
          title="Próximos ao Vencimento" 
          value={stats.expiring.toString()} 
          icon={<Clock className="h-8 w-8 text-warning-500" />} 
          bgColor="bg-warning-100" 
          isLoading={certificatesLoading}
          filter="expiring"
        />
        <StatsCard 
          title="Certificados Vencidos" 
          value={stats.expired.toString()} 
          icon={<AlertCircle className="h-8 w-8 text-danger-600" />} 
          bgColor="bg-danger-100" 
          isLoading={certificatesLoading}
          filter="expired"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Expirations */}
        <div className="col-span-2 bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-lg font-medium text-slate-800">Próximos Vencimentos</h3>
          </div>
          <div className="p-6">
            <ExpirationTable certificates={expiringCertificates} isLoading={certificatesLoading} />
          </div>
        </div>
        
        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-lg font-medium text-slate-800">Atividades Recentes</h3>
          </div>
          <div className="p-6">
            <ActivityList activities={activityLogs || []} isLoading={logsLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
