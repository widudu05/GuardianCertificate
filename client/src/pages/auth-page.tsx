import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ShieldCheck, User, Mail, Lock, LogIn } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Usuário deve ter pelo menos 3 caracteres"),
  name: z.string().min(3, "Nome completo é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  passwordConfirm: z.string().min(1, "Confirmação de senha é obrigatória"),
}).refine(data => data.password === data.passwordConfirm, {
  message: "As senhas não coincidem",
  path: ["passwordConfirm"],
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      name: "",
      email: "",
      password: "",
      passwordConfirm: ""
    }
  });

  const onLogin = (values: LoginValues) => {
    loginMutation.mutate(values);
  };

  const onRegister = (values: RegisterValues) => {
    registerMutation.mutate(values);
  };

  // Don't render the page if user is already logged in
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Left side - Auth forms */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 p-6 md:p-10">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center mb-8">
            <div className="mr-2 bg-primary-600 text-white p-2 rounded-md">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-primary-600">Guardião de Certificados</h1>
          </div>
          
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Registro</TabsTrigger>
            </TabsList>
            
            {/* Login Tab */}
            <TabsContent value="login">
              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl font-bold">Bem-vindo de volta</CardTitle>
                  <CardDescription>
                    Entre com suas credenciais para acessar sua conta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Usuário</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                <Input placeholder="Seu nome de usuário" className="pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                <Input type="password" placeholder="Sua senha" className="pl-10" {...field} />
                              </div>
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
                        {loginMutation.isPending ? (
                          "Entrando..."
                        ) : (
                          <span className="flex items-center">
                            <LogIn className="mr-2 h-4 w-4" /> Entrar
                          </span>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <div className="text-sm text-center text-gray-500">
                    Não tem uma conta?{" "}
                    <Button 
                      variant="link" 
                      className="p-0"
                      onClick={() => setActiveTab("register")}
                    >
                      Registre-se
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Register Tab */}
            <TabsContent value="register">
              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl font-bold">Criar uma conta</CardTitle>
                  <CardDescription>
                    Preencha os campos abaixo para criar sua conta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Usuário</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                <Input placeholder="Escolha um nome de usuário" className="pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                <Input placeholder="Seu nome completo" className="pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                <Input placeholder="Seu endereço de email" className="pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                <Input type="password" placeholder="Crie uma senha forte" className="pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="passwordConfirm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar Senha</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                <Input type="password" placeholder="Confirme sua senha" className="pl-10" {...field} />
                              </div>
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
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <div className="text-sm text-center text-gray-500">
                    Já tem uma conta?{" "}
                    <Button 
                      variant="link" 
                      className="p-0"
                      onClick={() => setActiveTab("login")}
                    >
                      Faça login
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Right side - Image/Hero Section */}
      <div className="hidden lg:block w-1/2 bg-primary-600 text-white p-12">
        <div className="h-full flex flex-col justify-center max-w-lg mx-auto">
          <div className="mb-6">
            <ShieldCheck className="h-16 w-16" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Guardião de Certificados Digitais</h2>
          <p className="text-lg mb-8">
            Plataforma completa para gerenciamento centralizado e seguro de seus certificados digitais A1 e A3.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="mr-3 mt-1 bg-primary-500 p-1 rounded-full">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Armazenamento Seguro</h3>
                <p className="text-primary-100">Guarde seus certificados e senhas com segurança máxima</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-3 mt-1 bg-primary-500 p-1 rounded-full">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Notificações de Vencimento</h3>
                <p className="text-primary-100">Receba alertas sobre certificados próximos do vencimento</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-3 mt-1 bg-primary-500 p-1 rounded-full">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Controle de Acesso</h3>
                <p className="text-primary-100">Defina permissões granulares para seus usuários</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
