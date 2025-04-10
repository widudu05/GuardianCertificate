import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useAuth } from "@/contexts/AuthContext";
import { 
  Loader2, 
  Users, 
  Building2, 
  Award, 
  FileCheck2, 
  AlertTriangle, 
  CheckCheck, 
  DollarSign, 
  Calendar, 
  Clock, 
  Zap, 
  ShieldAlert, 
  BarChart4, 
  LineChart as LineChartIcon, 
  Briefcase,
  ArrowUpRight,
  CreditCard,
  Receipt,
  UserPlus
} from "lucide-react";
import { Link } from "wouter";

// Cores para gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const AdminDashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Verificar se o usuário é um super-admin
  if (user?.role !== "super_admin" && user?.role !== "admin") {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-rose-600">Acesso Negado</CardTitle>
            <CardDescription>
              Você não tem permissão para acessar o painel administrativo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Entre em contato com o administrador do sistema para mais informações.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Buscar dados de organizações (clientes)
  const { data: organizations, isLoading: isLoadingOrgs } = useQuery({
    queryKey: ['/api/admin/organizations'],
    retry: false
  });

  // Buscar dados resumidos de usuários
  const { data: usersStats, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/admin/users/stats'],
    retry: false
  });

  // Buscar dados resumidos de certificados
  const { data: certificatesStats, isLoading: isLoadingCerts } = useQuery({
    queryKey: ['/api/admin/certificates/stats'],
    retry: false
  });
  
  // Dados de receita para o dashboard
  const { data: revenueStats, isLoading: isLoadingRevenue } = useQuery({
    queryKey: ['/api/admin/revenue'],
    retry: false
  });

  // Dados para exemplos (caso a API ainda não esteja pronta)
  const demoOrganizations = [
    { 
      id: 1, 
      name: "Organização Exemplo", 
      domain: "exemplo.com.br", 
      identifier: "12.345.678/0001-90", 
      plan: "enterprise", 
      status: "active", 
      usersCount: 8,
      companiesCount: 3,
      certificatesCount: 12,
      createdAt: "2023-02-15"
    },
    { 
      id: 2, 
      name: "Empresa ABC Ltda", 
      domain: "empresaabc.com.br", 
      identifier: "98.765.432/0001-10", 
      plan: "professional", 
      status: "active", 
      usersCount: 5,
      companiesCount: 2,
      certificatesCount: 7,
      createdAt: "2023-05-20"
    },
    { 
      id: 3, 
      name: "Tecnologia XYZ S.A.", 
      domain: "tecxyz.com", 
      identifier: "45.678.901/0001-23", 
      plan: "basic", 
      status: "active", 
      usersCount: 3,
      companiesCount: 1,
      certificatesCount: 4,
      createdAt: "2023-08-10"
    },
    { 
      id: 4, 
      name: "Comércio Inovador", 
      domain: "comercioinovador.com.br", 
      identifier: "78.901.234/0001-56", 
      plan: "professional", 
      status: "inactive", 
      usersCount: 0,
      companiesCount: 0,
      certificatesCount: 0,
      createdAt: "2023-09-05"
    }
  ];

  const demoUsersStats = {
    totalUsers: 16,
    activeUsers: 14,
    inactiveUsers: 2,
    usersByRole: [
      { name: "Admin", value: 4 },
      { name: "Gerente", value: 3 },
      { name: "Técnico", value: 5 },
      { name: "Financeiro", value: 4 }
    ],
    usersByOrganization: [
      { name: "Organização Exemplo", value: 8 },
      { name: "Empresa ABC Ltda", value: 5 },
      { name: "Tecnologia XYZ S.A.", value: 3 }
    ],
    recentLogins: [
      { id: 1, name: "João Silva", username: "joao", organization: "Organização Exemplo", lastLogin: "2023-10-25 09:45" },
      { id: 2, name: "Maria Souza", username: "maria", organization: "Empresa ABC Ltda", lastLogin: "2023-10-24 16:20" },
      { id: 3, name: "Carlos Pereira", username: "carlos", organization: "Tecnologia XYZ S.A.", lastLogin: "2023-10-24 14:15" }
    ]
  };

  const demoCertificatesStats = {
    total: 23,
    valid: 18,
    expiring: 3,
    expired: 2,
    byType: [
      { name: "A1", value: 14 },
      { name: "A3", value: 9 }
    ],
    byMonth: [
      { name: "Jan", a1: 1, a3: 0 },
      { name: "Fev", a1: 2, a3: 1 },
      { name: "Mar", a1: 1, a3: 2 },
      { name: "Abr", a1: 0, a3: 1 },
      { name: "Mai", a1: 3, a3: 1 },
      { name: "Jun", a1: 1, a3: 0 },
      { name: "Jul", a1: 2, a3: 1 },
      { name: "Ago", a1: 1, a3: 0 },
      { name: "Set", a1: 1, a3: 2 },
      { name: "Out", a1: 2, a3: 1 },
      { name: "Nov", a1: 0, a3: 0 },
      { name: "Dez", a1: 0, a3: 0 }
    ]
  };

  // Usar dados reais ou demo conforme disponibilidade
  const orgData = organizations || demoOrganizations;
  const userData = usersStats || demoUsersStats;
  const certData = certificatesStats || demoCertificatesStats;

  const isLoading = isLoadingOrgs || isLoadingUsers || isLoadingCerts;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando dashboard administrativo...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">
            Visão geral das organizações e usuários do sistema.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="organizations">Clientes</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="certificates">Certificados</TabsTrigger>
            <TabsTrigger value="revenue">Faturamento</TabsTrigger>
            <TabsTrigger value="plans">Planos</TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total de Organizações
                  </CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{orgData.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {orgData.filter(org => org.status === "active").length} organizações ativas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total de Usuários
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userData.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    {userData.activeUsers} usuários ativos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total de Certificados
                  </CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{certData.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {certData.valid} certificados válidos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Certificados Expirados
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{certData.expired}</div>
                  <p className="text-xs text-muted-foreground">
                    {certData.expiring} certificados prestes a expirar
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Certificados Emitidos por Mês</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={certData.byMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="a1" name="Certificados A1" fill="#0088FE" />
                      <Bar dataKey="a3" name="Certificados A3" fill="#00C49F" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Usuários por Organização</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={userData.usersByOrganization}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {userData.usersByOrganization.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Organizações Recentes</CardTitle>
                  <CardDescription>
                    Organizações adicionadas recentemente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orgData
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .slice(0, 5)
                        .map((org) => (
                          <TableRow key={org.id}>
                            <TableCell className="font-medium">{org.name}</TableCell>
                            <TableCell>
                              <Badge variant={org.plan === "enterprise" ? "default" : 
                                      org.plan === "professional" ? "secondary" : "outline"}>
                                {org.plan.charAt(0).toUpperCase() + org.plan.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(org.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Logins Recentes</CardTitle>
                  <CardDescription>
                    Usuários que fizeram login recentemente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Organização</TableHead>
                        <TableHead>Último Login</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userData.recentLogins.map((login) => (
                        <TableRow key={login.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{login.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="text-sm font-medium">{login.name}</div>
                            </div>
                          </TableCell>
                          <TableCell>{login.organization}</TableCell>
                          <TableCell>{login.lastLogin}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Organizações */}
          <TabsContent value="organizations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Organizações</CardTitle>
                <CardDescription>
                  Todas as organizações cadastradas no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Domínio</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Usuários</TableHead>
                      <TableHead>Empresas</TableHead>
                      <TableHead>Certificados</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orgData.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell className="font-medium">{org.name}</TableCell>
                        <TableCell>{org.domain}</TableCell>
                        <TableCell>{org.identifier}</TableCell>
                        <TableCell>
                          <Badge variant={org.plan === "enterprise" ? "default" : 
                                org.plan === "professional" ? "secondary" : "outline"}>
                            {org.plan.charAt(0).toUpperCase() + org.plan.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={org.status === "active" ? "default" : "destructive"}>
                            {org.status === "active" ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>{org.usersCount}</TableCell>
                        <TableCell>{org.companiesCount}</TableCell>
                        <TableCell>{org.certificatesCount}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Usuários */}
          <TabsContent value="users" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Usuários por Perfil</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={userData.usersByRole}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {userData.usersByRole.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detalhes de Usuários</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Total de Usuários</p>
                        <p className="text-3xl font-bold">{userData.totalUsers}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Usuários Ativos</p>
                        <p className="text-3xl font-bold text-green-600">{userData.activeUsers}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Usuários Inativos</p>
                        <p className="text-3xl font-bold text-red-600">{userData.inactiveUsers}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Média por Organização</p>
                        <p className="text-3xl font-bold">
                          {(userData.totalUsers / (orgData.length || 1)).toFixed(1)}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-medium">Logins Recentes</h3>
                      <ul className="mt-2 space-y-2">
                        {userData.recentLogins.map((login) => (
                          <li key={login.id} className="flex items-center justify-between rounded-md border p-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{login.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{login.name}</p>
                                <p className="text-xs text-muted-foreground">{login.organization}</p>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">{login.lastLogin}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Certificados */}
          <TabsContent value="certificates" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Certificados Válidos
                  </CardTitle>
                  <CheckCheck className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{certData.valid}</div>
                  <p className="text-xs text-muted-foreground">
                    {((certData.valid / certData.total) * 100).toFixed(1)}% do total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Certificados A Expirar
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{certData.expiring}</div>
                  <p className="text-xs text-muted-foreground">
                    Expiram nos próximos 30 dias
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Certificados Expirados
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{certData.expired}</div>
                  <p className="text-xs text-muted-foreground">
                    {((certData.expired / certData.total) * 100).toFixed(1)}% do total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Tipo de Certificado
                  </CardTitle>
                  <FileCheck2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-2xl font-bold text-blue-500">{certData.byType[0].value}</div>
                      <p className="text-xs text-muted-foreground">A1</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-500">{certData.byType[1].value}</div>
                      <p className="text-xs text-muted-foreground">A3</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Emissão de Certificados por Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={certData.byMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="a1" name="Certificados A1" fill="#0088FE" />
                    <Bar dataKey="a3" name="Certificados A3" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Faturamento */}
          <TabsContent value="revenue" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Receita Mensal
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ 48.350,00</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500 flex items-center">
                      <ArrowUpRight className="mr-1 h-4 w-4" />
                      +12,5% em relação ao mês anterior
                    </span>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Receita Total Anual
                  </CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ 426.780,00</div>
                  <p className="text-xs text-muted-foreground">
                    Previsão para o ano: R$ 520.000,00
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Valor Médio por Cliente
                  </CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ 12.087,50</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500 flex items-center">
                      <ArrowUpRight className="mr-1 h-4 w-4" />
                      +5,2% em relação ao mês anterior
                    </span>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Novos Clientes (mês)
                  </CardTitle>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">
                    Taxa de conversão: 12%
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Receita Mensal (últimos 12 meses)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart
                      data={[
                        { month: "Jan", value: 35420 },
                        { month: "Fev", value: 37650 },
                        { month: "Mar", value: 38970 },
                        { month: "Abr", value: 39800 },
                        { month: "Mai", value: 41200 },
                        { month: "Jun", value: 42100 },
                        { month: "Jul", value: 42980 },
                        { month: "Ago", value: 43500 },
                        { month: "Set", value: 44200 },
                        { month: "Out", value: 46300 },
                        { month: "Nov", value: 48350 },
                        { month: "Dez", value: 0 }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`R$ ${value.toLocaleString('pt-BR')}`, "Receita"]} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        name="Receita (R$)"
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Receita por Plano</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Enterprise", value: 26300 },
                          { name: "Professional", value: 18400 },
                          { name: "Basic", value: 3650 }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        <Cell fill="#0088FE" />
                        <Cell fill="#00C49F" />
                        <Cell fill="#FFBB28" />
                      </Pie>
                      <Tooltip formatter={(value) => [`R$ ${value.toLocaleString('pt-BR')}`, "Receita"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
                <CardFooter>
                  <div className="text-sm text-muted-foreground">
                    <p>Enterprise: R$ 26.300,00 (54%)</p>
                    <p>Professional: R$ 18.400,00 (38%)</p>
                    <p>Basic: R$ 3.650,00 (8%)</p>
                  </div>
                </CardFooter>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Histórico de Pagamentos</CardTitle>
                <CardDescription>
                  Últimos pagamentos recebidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Organização Exemplo</TableCell>
                      <TableCell>
                        <Badge variant="default">Enterprise</Badge>
                      </TableCell>
                      <TableCell>R$ 8.500,00</TableCell>
                      <TableCell>10/11/2023</TableCell>
                      <TableCell>
                        <Badge variant="default">Pago</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Empresa ABC Ltda</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Professional</Badge>
                      </TableCell>
                      <TableCell>R$ 3.800,00</TableCell>
                      <TableCell>08/11/2023</TableCell>
                      <TableCell>
                        <Badge variant="default">Pago</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Tecnologia XYZ S.A.</TableCell>
                      <TableCell>
                        <Badge variant="outline">Basic</Badge>
                      </TableCell>
                      <TableCell>R$ 1.200,00</TableCell>
                      <TableCell>05/11/2023</TableCell>
                      <TableCell>
                        <Badge variant="default">Pago</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Indústria Delta</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Professional</Badge>
                      </TableCell>
                      <TableCell>R$ 3.800,00</TableCell>
                      <TableCell>03/11/2023</TableCell>
                      <TableCell>
                        <Badge variant="default">Pago</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Comércio Beta</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Professional</Badge>
                      </TableCell>
                      <TableCell>R$ 3.800,00</TableCell>
                      <TableCell>01/11/2023</TableCell>
                      <TableCell>
                        <Badge variant="destructive">Atraso</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Planos */}
          <TabsContent value="plans" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Plano Basic</CardTitle>
                  <CardDescription>
                    Ideal para empresas pequenas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold mb-4">R$ 1.200<span className="text-sm font-normal text-muted-foreground">/mês</span></div>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-center">
                      <CheckCheck className="mr-2 h-4 w-4 text-green-500" /> Até 5 usuários
                    </li>
                    <li className="flex items-center">
                      <CheckCheck className="mr-2 h-4 w-4 text-green-500" /> Até 10 certificados
                    </li>
                    <li className="flex items-center">
                      <CheckCheck className="mr-2 h-4 w-4 text-green-500" /> Suporte por email
                    </li>
                    <li className="flex items-center">
                      <CheckCheck className="mr-2 h-4 w-4 text-green-500" /> Backup diário
                    </li>
                  </ul>

                  <div className="mt-4">
                    <div className="text-sm text-muted-foreground mb-1">Clientes ativos: 8</div>
                    <div className="text-sm text-muted-foreground">Receita mensal: R$ 9.600,00</div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Editar plano</Button>
                </CardFooter>
              </Card>

              <Card className="border-primary">
                <CardHeader>
                  <CardTitle>Plano Professional</CardTitle>
                  <CardDescription>
                    Para empresas em crescimento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold mb-4">R$ 3.800<span className="text-sm font-normal text-muted-foreground">/mês</span></div>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-center">
                      <CheckCheck className="mr-2 h-4 w-4 text-green-500" /> Até 15 usuários
                    </li>
                    <li className="flex items-center">
                      <CheckCheck className="mr-2 h-4 w-4 text-green-500" /> Até 50 certificados
                    </li>
                    <li className="flex items-center">
                      <CheckCheck className="mr-2 h-4 w-4 text-green-500" /> Suporte prioritário
                    </li>
                    <li className="flex items-center">
                      <CheckCheck className="mr-2 h-4 w-4 text-green-500" /> Backup em tempo real
                    </li>
                    <li className="flex items-center">
                      <CheckCheck className="mr-2 h-4 w-4 text-green-500" /> API de integração
                    </li>
                  </ul>

                  <div className="mt-4">
                    <div className="text-sm text-muted-foreground mb-1">Clientes ativos: 15</div>
                    <div className="text-sm text-muted-foreground">Receita mensal: R$ 57.000,00</div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="default" className="w-full">Editar plano</Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Plano Enterprise</CardTitle>
                  <CardDescription>
                    Soluções completas para grandes empresas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold mb-4">R$ 8.500<span className="text-sm font-normal text-muted-foreground">/mês</span></div>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-center">
                      <CheckCheck className="mr-2 h-4 w-4 text-green-500" /> Usuários ilimitados
                    </li>
                    <li className="flex items-center">
                      <CheckCheck className="mr-2 h-4 w-4 text-green-500" /> Certificados ilimitados
                    </li>
                    <li className="flex items-center">
                      <CheckCheck className="mr-2 h-4 w-4 text-green-500" /> Suporte 24/7
                    </li>
                    <li className="flex items-center">
                      <CheckCheck className="mr-2 h-4 w-4 text-green-500" /> Backup em tempo real
                    </li>
                    <li className="flex items-center">
                      <CheckCheck className="mr-2 h-4 w-4 text-green-500" /> API completa
                    </li>
                    <li className="flex items-center">
                      <CheckCheck className="mr-2 h-4 w-4 text-green-500" /> Painel administrativo dedicado
                    </li>
                    <li className="flex items-center">
                      <CheckCheck className="mr-2 h-4 w-4 text-green-500" /> Gerente de conta exclusivo
                    </li>
                  </ul>

                  <div className="mt-4">
                    <div className="text-sm text-muted-foreground mb-1">Clientes ativos: 10</div>
                    <div className="text-sm text-muted-foreground">Receita mensal: R$ 85.000,00</div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Editar plano</Button>
                </CardFooter>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Próximos Vencimentos</CardTitle>
                <CardDescription>
                  Clientes com planos prestes a vencer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Valor Mensal</TableHead>
                      <TableHead>Data de Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Empresa ABC Ltda</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Professional</Badge>
                      </TableCell>
                      <TableCell>R$ 3.800,00</TableCell>
                      <TableCell>15/11/2023</TableCell>
                      <TableCell>
                        <Badge variant="warning" className="bg-yellow-500">Vence em 5 dias</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">Renovar</Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Tecnologia XYZ S.A.</TableCell>
                      <TableCell>
                        <Badge variant="outline">Basic</Badge>
                      </TableCell>
                      <TableCell>R$ 1.200,00</TableCell>
                      <TableCell>20/11/2023</TableCell>
                      <TableCell>
                        <Badge variant="warning" className="bg-yellow-500">Vence em 10 dias</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">Renovar</Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Indústria Delta</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Professional</Badge>
                      </TableCell>
                      <TableCell>R$ 3.800,00</TableCell>
                      <TableCell>25/11/2023</TableCell>
                      <TableCell>
                        <Badge variant="outline">Vence em 15 dias</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">Renovar</Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Comércio Beta</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Professional</Badge>
                      </TableCell>
                      <TableCell>R$ 3.800,00</TableCell>
                      <TableCell>01/11/2023</TableCell>
                      <TableCell>
                        <Badge variant="destructive">Vencido</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="default" size="sm">Renovar</Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter>
                <Button variant="outline">Ver todos os clientes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;