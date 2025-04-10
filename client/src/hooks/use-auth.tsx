import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as DbUser } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/types";
import { z } from "zod";

// Definição dos tipos
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
};

type LoginData = Pick<DbUser, "username" | "password">;

// Schema de registro com confirmação de senha
const registerSchema = insertUserSchema.extend({
  passwordConfirm: z.string(),
}).refine(data => data.password === data.passwordConfirm, {
  message: "As senhas não coincidem",
  path: ["passwordConfirm"]
});

type RegisterData = z.infer<typeof registerSchema>;

// Contexto de autenticação
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  error: null,
  loginMutation: {} as UseMutationResult<User, Error, LoginData>,
  logoutMutation: {} as UseMutationResult<void, Error, void>,
  registerMutation: {} as UseMutationResult<User, Error, RegisterData>,
});

// Provider de autenticação
const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  
  // Buscar dados do usuário atual
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: async ({ queryKey }) => {
      try {
        const res = await fetch(queryKey[0] as string, {
          credentials: "include",
        });
        if (res.status === 401) return null;
        if (!res.ok) throw new Error("Falha ao obter dados do usuário");
        return await res.json();
      } catch (err) {
        return null;
      }
    },
  });

  // Mutation de login
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo, ${user.name || "Administrador do Sistema"}!`,
      });
      
      // Redirecionamento forçado
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no login",
        description: "Usuário ou senha inválidos",
        variant: "destructive",
      });
    },
  });

  // Mutation de registro
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      // Remove passwordConfirm before sending to API
      const { passwordConfirm, ...registerData } = data;
      const res = await apiRequest("POST", "/api/register", registerData);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Conta criada com sucesso",
        description: `Bem-vindo, ${user.name}!`,
      });
      
      // Redirecionamento forçado
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no registro",
        description: error.message || "Não foi possível criar sua conta",
        variant: "destructive",
      });
    },
  });

  // Mutation de logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logout realizado com sucesso",
        description: "Você foi desconectado com sucesso",
      });
      
      // Redirecionamento forçado
      window.location.href = "/auth";
    },
    onError: (error: Error) => {
      toast({
        title: "Falha ao fazer logout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
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
};

// Hook para acessar o contexto de autenticação
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { AuthProvider, useAuth };
