import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Shield, ShieldCheck } from "lucide-react";

// Login form schema
const loginFormSchema = z.object({
  username: z.string().min(3, "Usuário deve ter no mínimo 3 caracteres"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

// Registration form schema
const registerFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  username: z.string().min(3, "Usuário deve ter no mínimo 3 caracteres"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirme sua senha"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const [tab, setTab] = useState<string>("login");
  const { user, loginMutation, registerMutation } = useAuth();
  const [location, navigate] = useLocation();

  // Redirect if already logged in
  if (user) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-6 items-center">
        <div className="hidden md:flex flex-col gap-6 p-8">
          <div className="flex items-center text-primary-800 space-x-2">
            <Shield size={40} className="text-primary-600" />
            <span className="text-3xl font-semibold">Guardião</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-800">
            Gerencie seus certificados digitais com segurança
          </h1>
          <p className="text-slate-600 text-lg">
            Uma solução completa para o armazenamento, gestão e monitoramento de certificados A1 e A3,
            com controle de vencimentos e notificações automáticas.
          </p>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mt-4">
            <h3 className="text-lg font-medium mb-4 text-slate-800">Benefícios:</h3>
            <ul className="space-y-3">
              {[
                "Armazenamento seguro com criptografia avançada",
                "Alertas automáticos de vencimento",
                "Gestão multiempresa centralizada",
                "Controle de usuários e permissões",
                "Auditoria completa de ações"
              ].map((item, i) => (
                <li key={i} className="flex items-start space-x-2">
                  <ShieldCheck className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Card className="shadow-lg border-slate-200 w-full">
          <CardHeader>
            <div className="md:hidden flex items-center text-primary-800 mb-4 justify-center">
              <Shield size={30} className="text-primary-600 mr-2" />
              <span className="text-2xl font-semibold">Guardião</span>
            </div>
            <CardTitle className="text-center text-2xl text-slate-800">
              {tab === "login" ? "Acessar sua conta" : "Criar nova conta"}
            </CardTitle>
            <CardDescription className="text-center">
              {tab === "login" 
                ? "Faça login para gerenciar seus certificados digitais"
                : "Registre-se para começar a usar o Guardião"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Registrar</TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login">
                <LoginForm loginMutation={loginMutation} />
              </TabsContent>

              {/* Registration Form */}
              <TabsContent value="register">
                <RegisterForm registerMutation={registerMutation} />
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-slate-100 pt-6">
            <p className="text-xs text-center text-slate-500">
              Ao acessar o sistema, você concorda com nossos
              <a href="#" className="text-primary-600 hover:underline"> termos de serviço </a>
              e
              <a href="#" className="text-primary-600 hover:underline"> política de privacidade</a>.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

// Login Form Component
function LoginForm({ loginMutation }: any) {
  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof loginFormSchema>) {
    loginMutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Usuário</FormLabel>
              <FormControl>
                <Input placeholder="Digite seu nome de usuário" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Digite sua senha" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          className="w-full"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </Form>
  );
}

// Registration Form Component
function RegisterForm({ registerMutation }: any) {
  const form = useForm<z.infer<typeof registerFormSchema>>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  function onSubmit(values: z.infer<typeof registerFormSchema>) {
    registerMutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Digite seu nome completo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Digite seu email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome de Usuário</FormLabel>
              <FormControl>
                <Input placeholder="Escolha um nome de usuário" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Crie uma senha forte" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar Senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Confirme sua senha" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          className="w-full"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? "Registrando..." : "Registrar"}
        </Button>
      </form>
    </Form>
  );
}
