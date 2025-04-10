import { useQuery } from "@tanstack/react-query";
import { FileText, AlarmClock, Computer, Usb } from "lucide-react";
import { DashboardStats, Certificate, ActivityLog } from "@/types";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ExpiringCertificates } from "@/components/dashboard/expiring-certificates";
import { ActivityLogList } from "@/components/dashboard/activity-log";
import { AppLayout } from "@/layouts/app-layout";
import { useCompanyContext } from "@/hooks/use-company-context";

export default function Dashboard() {
  const { selectedCompanyId } = useCompanyContext();
  
  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats", { companyId: selectedCompanyId }],
    queryFn: async () => {
      const url = selectedCompanyId && selectedCompanyId !== 0
        ? `/api/dashboard/stats?companyId=${selectedCompanyId}`
        : "/api/dashboard/stats";
      
      const res = await fetch(url, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch dashboard stats");
      return await res.json();
    },
  });
  
  // Fetch expiring certificates
  const { data: certificates = [], isLoading: certificatesLoading } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates", { expiringOnly: true, companyId: selectedCompanyId }],
    queryFn: async () => {
      let url = "/api/certificates?expiringOnly=true";
      if (selectedCompanyId && selectedCompanyId !== 0) {
        url += `&companyId=${selectedCompanyId}`;
      }
      
      const res = await fetch(url, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch expiring certificates");
      return await res.json();
    },
  });
  
  // Fetch recent activity logs
  const { data: logs = [], isLoading: logsLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/logs", { limit: 10, companyId: selectedCompanyId }],
    queryFn: async () => {
      let url = "/api/logs?limit=10";
      if (selectedCompanyId && selectedCompanyId !== 0) {
        url += `&companyId=${selectedCompanyId}`;
      }
      
      const res = await fetch(url, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch activity logs");
      return await res.json();
    },
  });

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
        <p className="mt-1 text-gray-600">Visão geral do sistema de certificados digitais</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total de Certificados"
          value={stats?.totalCertificates || 0}
          icon={<FileText className="h-5 w-5" />}
          trend={{ value: 5, label: "desde o último mês" }}
          color="blue"
          isLoading={statsLoading}
        />
        
        <StatsCard
          title="Cert. a Vencer (30d)"
          value={stats?.expiringCertificates || 0}
          icon={<AlarmClock className="h-5 w-5" />}
          color="orange"
          isLoading={statsLoading}
        />
        
        <StatsCard
          title="Certificados A1"
          value={stats?.a1Certificates || 0}
          icon={<Computer className="h-5 w-5" />}
          color="purple"
          isLoading={statsLoading}
        />
        
        <StatsCard
          title="Certificados A3"
          value={stats?.a3Certificates || 0}
          icon={<Usb className="h-5 w-5" />}
          color="green"
          isLoading={statsLoading}
        />
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expiring Certificates Section */}
        <div className="lg:col-span-2">
          <ExpiringCertificates 
            certificates={certificates} 
            isLoading={certificatesLoading} 
          />
        </div>
        
        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <ActivityLogList 
            logs={logs}
            isLoading={logsLoading}
          />
        </div>
      </div>
    </AppLayout>
  );
}
