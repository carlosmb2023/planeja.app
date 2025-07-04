import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authManager } from "@/lib/auth";
import { PiggyBank, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface RegisterProps {
  onRegister?: () => void;
}

export default function Register({ onRegister }: RegisterProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Basic validation
      if (formData.password !== formData.confirmPassword) {
        throw new Error("As senhas não coincidem");
      }

      if (formData.password.length < 6) {
        throw new Error("A senha deve ter pelo menos 6 caracteres");
      }

      await authManager.register(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName
      );

      // Marca que aceitou a privacidade para novos usuários
      localStorage.setItem("privacy_accepted", "true");

      toast({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo ao Planeja",
      });
      onRegister?.();
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Erro ao criar conta",
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
              <Link href="/login" className="absolute top-4 left-4 p-2 text-gray-600 hover:text-primary">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <PiggyBank className="text-white h-8 w-8" />
              </div>
              <h1 className="font-montserrat text-2xl font-bold text-dark-bg">
                Criar Conta
              </h1>
              <p className="text-gray-600 mt-2">
                Junte-se ao Planeja
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                    Nome
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    className="mt-2 px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary border-gray-300"
                    placeholder="João"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                    Sobrenome
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    className="mt-2 px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary border-gray-300"
                    placeholder="Silva"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="mt-2 px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary border-gray-300"
                  placeholder="seu.email@cooperativa.com"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use seu e-mail autorizado da cooperativa
                </p>
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Senha
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
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

              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirmar Senha
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className="px-4 py-3 pr-12 rounded-xl focus:ring-2 focus:ring-primary border-gray-300"
                    placeholder="••••••••"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isLoading ? "Criando conta..." : "Criar Conta"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className="text-primary hover:text-primary-dark text-sm font-medium">
                Já tem uma conta? Entre aqui
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}