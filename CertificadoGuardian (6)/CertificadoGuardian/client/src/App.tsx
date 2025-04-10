import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Certificates from "@/pages/certificates";
import Users from "@/pages/users";
import Logs from "@/pages/logs";
import Settings from "@/pages/settings";
import Documentation from "@/pages/documentation";
import AdminDashboard from "@/pages/admin/dashboard";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/certificates" component={Certificates} />
      <ProtectedRoute path="/users" component={Users} />
      <ProtectedRoute path="/logs" component={Logs} />
      <ProtectedRoute path="/settings" component={Settings} />
      <ProtectedRoute path="/documentation" component={Documentation} />
      <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/auth" component={AuthPage} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
