import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Lock, Database, Eye, EyeOff, Check, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function PrivacySetup() {
  const [understood, setUnderstood] = useState(false);
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: Lock,
      title: "Criptografia no Navegador",
      description: "Seus dados são criptografados antes de sair do seu dispositivo"
    },
    {
      icon: Shield,
      title: "Chave Pessoal Única",
      description: "Baseada na sua senha, nunca é enviada ao servidor"
    },
    {
      icon: Database,
      title: "Banco Central Seguro",
      description: "Armazenamos apenas dados criptografados"
    },
    {
      icon: EyeOff,
      title: "Privacidade Total",
      description: "Nem mesmo nós podemos ver seus dados"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50/50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Sistema de Privacidade Total
          </h1>
          <p className="text-lg text-gray-600">
            Seus dados financeiros protegidos com criptografia de ponta
          </p>
        </div>

        {/* Como Funciona */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Como Funciona Nossa Proteção
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-3 p-4 rounded-lg bg-gray-50">
                  <feature.icon className="h-8 w-8 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Alert className="bg-green-50 border-green-200">
              <Shield className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Garantia de Privacidade:</strong> Usamos o mesmo nível de criptografia
                que bancos e aplicativos de mensagens seguras. Seus dados são tão privados
                que nem mesmo nós conseguimos acessá-los.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Detalhes Técnicos */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Implementação</CardTitle>
            <CardDescription>
              Para usuários que querem entender melhor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <span className="text-primary">1.</span> Derivação de Chave
              </h4>
              <p className="text-gray-600 ml-5">
                Sua senha + email criam uma chave única usando PBKDF2 com 10.000 iterações
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <span className="text-primary">2.</span> Criptografia AES-256
              </h4>
              <p className="text-gray-600 ml-5">
                Todos os dados sensíveis são criptografados com AES-256 antes do envio
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <span className="text-primary">3.</span> Banco Central
              </h4>
              <p className="text-gray-600 ml-5">
                Um único banco de dados armazena dados criptografados de todos os usuários
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <span className="text-primary">4.</span> Recuperação
              </h4>
              <p className="text-gray-600 ml-5">
                Apenas você, com sua senha correta, pode descriptografar seus dados
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Comparação */}
        <Card>
          <CardHeader>
            <CardTitle>Comparação de Modelos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border-2 border-gray-200 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Modelo Tradicional
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Dados armazenados em texto claro</li>
                  <li>• Administrador pode ver tudo</li>
                  <li>• Risco em caso de vazamento</li>
                  <li>• Depende de confiança no provedor</li>
                </ul>
              </div>
              
              <div className="p-4 border-2 border-primary rounded-lg bg-primary/5">
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-primary">
                  <EyeOff className="h-4 w-4" />
                  Nosso Modelo
                </h3>
                <ul className="text-sm space-y-1">
                  <li className="text-green-700">✓ Dados sempre criptografados</li>
                  <li className="text-green-700">✓ Nem nós podemos ver</li>
                  <li className="text-green-700">✓ Seguro mesmo se vazar</li>
                  <li className="text-green-700">✓ Você controla seus dados</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Confirmação */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="understood"
                checked={understood}
                onChange={(e) => setUnderstood(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="understood" className="text-sm cursor-pointer">
                Entendi que meus dados serão criptografados no meu dispositivo antes de serem
                enviados ao servidor e que apenas eu, com minha senha, posso acessá-los.
                <strong> Se eu esquecer minha senha, não será possível recuperar meus dados.</strong>
              </label>
            </div>

            <Button
              className="w-full mt-4"
              disabled={!understood}
              onClick={() => {
                localStorage.setItem("privacy_accepted", "true");
                setLocation("/login");
              }}
            >
              Continuar para o Login
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}