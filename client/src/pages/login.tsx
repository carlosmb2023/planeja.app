import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authManager } from "@/lib/auth";
import { PiggyBank, Eye, EyeOff, Database } from "lucide-react";
import { Link } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LoginProps {
  onLogin?: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if database is configured
    const checkDatabase = async () => {
      try {
        const response = await fetch("/api/health");
        const data = await response.json();
        if (!data.database) {
          setNeedsSetup(true);
        }
      } catch (error) {
        setNeedsSetup(true);
      }
    };
    checkDatabase();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authManager.login(email, password);
      
      // Marca que aceitou a privacidade para usuários existentes
      localStorage.setItem("privacy_accepted", "true");
      
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao Planeja",
      });
      onLogin?.();
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message || "Credenciais inválidas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary to-dark-bg">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl transform hover:scale-105 transition-transform duration-300">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <PiggyBank className="text-white h-8 w-8" />
              </div>
              <h1 className="font-montserrat text-2xl font-bold text-dark-bg">
                Planeja
              </h1>
              <p className="text-gray-600 mt-2">
                Gerencie suas finanças com segurança
              </p>
              <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                <p className="text-xs text-dark-bg font-medium">Demo de Teste</p>
                <p className="text-xs text-gray-600">
                  Email: admin@test.com<br />
                  Senha: demo123
                </p>
              </div>
            </div>

            {needsSetup && (
              <Alert className="mt-4 bg-yellow-50 border-yellow-200">
                <Database className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-sm">
                  <strong>Configuração necessária:</strong> Configure seu banco de dados pessoal para começar a usar o Planeja.
                  <Link href="/database-setup">
                    <Button variant="link" className="p-0 h-auto ml-1 text-primary">
                      Clique aqui para configurar
                    </Button>
                  </Link>
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary border-gray-300"
                  placeholder="seu.email@cooperativa.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Senha
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="px-4 py-3 pr-12 rounded-xl focus:ring-2 focus:ring-primary border-gray-300"
                    placeholder="••••••••"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <a
                href="#"
                className="text-primary hover:text-primary-dark text-sm font-medium block"
              >
                Esqueceu sua senha?
              </a>
              <div className="border-t border-gray-200 pt-3">
                <p className="text-gray-600 text-sm mb-2">Ainda não tem uma conta?</p>
                <Link href="/register" className="text-primary hover:text-primary-dark text-sm font-medium">
                  Criar conta gratuita
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
