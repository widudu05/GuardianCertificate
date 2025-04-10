import { Switch, Route } from "wouter";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import CertificatesPage from "@/pages/certificates-page";
import CompaniesPage from "@/pages/companies-page";
import UsersPage from "@/pages/users-page";
import LogsPage from "@/pages/logs-page";
import { useAuth } from "./hooks/use-auth";

function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return null; // Handle initial loading state
  }

  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/certificates" component={CertificatesPage} />
      <ProtectedRoute path="/companies" component={CompaniesPage} />
      <ProtectedRoute path="/users" component={UsersPage} />
      <ProtectedRoute path="/logs" component={LogsPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
