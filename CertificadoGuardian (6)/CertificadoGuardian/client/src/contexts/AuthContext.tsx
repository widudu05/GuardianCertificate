import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type User = {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
};

type Company = {
  id: number;
  name: string;
  identifier: string;
};

type UserData = {
  user: User | null;
  companies: Company[];
};

type AuthContextType = {
  user: User | null;
  companies: Company[];
  currentCompany: Company | null;
  setCurrentCompany: (company: Company) => void;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
};

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  name: string;
};

const AuthContext = createContext<AuthContextType | null>(null);

function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [currentCompany, setCurrentCompanyState] = useState<Company | null>(null);
  
  // Referência do botão de logout para ser acessado por outros componentes
  useEffect(() => {
    // Adiciona um botão oculto para logout que pode ser acionado programaticamente
    if (!document.querySelector('[data-logout]')) {
      const logoutButton = document.createElement('button');
      logoutButton.setAttribute('data-logout', 'true');
      logoutButton.style.display = 'none';
      logoutButton.addEventListener('click', () => {
        logoutMutation.mutate();
      });
      document.body.appendChild(logoutButton);
    }
    
    return () => {
      const logoutButton = document.querySelector('[data-logout]');
      if (logoutButton) logoutButton.remove();
    };
  }, []);

  const {
    data: userData,
    error,
    isLoading,
  } = useQuery<UserData, Error>({
    queryKey: ["/api/me"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/user", {
          credentials: "include",
        });
        
        if (res.status === 401) {
          return { user: null, companies: [] };
        }
        
        if (!res.ok) {
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        
        const user = await res.json();
        
        // Get the user's companies
        const companiesRes = await fetch("/api/companies", {
          credentials: "include",
        });
        
        if (!companiesRes.ok) {
          throw new Error(`${companiesRes.status}: ${companiesRes.statusText}`);
        }
        
        const companies = await companiesRes.json();
        
        return { user, companies };
      } catch (e) {
        // Return empty data structure instead of undefined
        return { user: null, companies: [] };
      }
    },
  });

  // Set the first company as current when companies load or change
  useEffect(() => {
    if (userData?.companies?.length && !currentCompany) {
      setCurrentCompanyState(userData.companies[0]);
    }
  }, [userData?.companies, currentCompany]);

  const setCurrentCompany = (company: Company) => {
    setCurrentCompanyState(company);
  };

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      navigate("/");
      toast({
        title: "Login bem-sucedido",
        description: "Bem-vindo ao Guardião de Certificados Digitais!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao fazer login",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      navigate("/");
      toast({
        title: "Registro bem-sucedido",
        description: "Sua conta foi criada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/me"], null);
      navigate("/auth");
      toast({
        title: "Logout bem-sucedido",
        description: "Você foi desconectado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao fazer logout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: userData?.user ?? null,
        companies: userData?.companies ?? [],
        currentCompany,
        setCurrentCompany,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export { AuthProvider, useAuth };
