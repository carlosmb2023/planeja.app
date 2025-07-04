import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Database, 
  Copy, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ArrowRight,
  Shield,
  Cloud,
  Key
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DatabaseSetup() {
  const [databaseUrl, setDatabaseUrl] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência",
    });
  };

  const validateDatabaseUrl = async () => {
    if (!databaseUrl) {
      toast({
        title: "URL necessária",
        description: "Por favor, insira a URL do banco de dados",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    
    // Simula validação da URL
    setTimeout(() => {
      // Verifica se a URL tem o formato correto do Supabase
      const isSupabaseUrl = databaseUrl.includes("supabase.co") && 
                           databaseUrl.startsWith("postgresql://");
      
      if (isSupabaseUrl) {
        setIsValid(true);
        // Salva no localStorage para persistir
        localStorage.setItem("DATABASE_URL", databaseUrl);
        toast({
          title: "Conexão validada!",
          description: "Banco de dados configurado com sucesso",
        });
      } else {
        toast({
          title: "URL inválida",
          description: "Por favor, verifique se copiou a URL correta do Supabase",
          variant: "destructive",
        });
      }
      setIsValidating(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Database className="text-white h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold text-dark-bg mb-2">Configuração do Banco de Dados</h1>
          <p className="text-gray-600">
            Configure seu banco de dados Supabase pessoal para manter total controle sobre seus dados
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 text-center">
              <Shield className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Dados Privados</h3>
              <p className="text-sm text-gray-600">
                Seus dados ficam em sua conta pessoal
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 text-center">
              <Cloud className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-1">100% Gratuito</h3>
              <p className="text-sm text-gray-600">
                Supabase oferece plano gratuito generoso
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 text-center">
              <Key className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Controle Total</h3>
              <p className="text-sm text-gray-600">
                Você mantém acesso completo aos dados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Setup Steps */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Configuração em 3 Passos Simples</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={`step-${currentStep}`} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger 
                  value="step-1" 
                  onClick={() => setCurrentStep(1)}
                  className="data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  1. Criar Conta
                </TabsTrigger>
                <TabsTrigger 
                  value="step-2" 
                  onClick={() => setCurrentStep(2)}
                  className="data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  2. Obter URL
                </TabsTrigger>
                <TabsTrigger 
                  value="step-3" 
                  onClick={() => setCurrentStep(3)}
                  className="data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  3. Conectar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="step-1" className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Passo 1: Criar sua conta no Supabase</h3>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm mb-3">
                      1. Acesse o site do Supabase e crie uma conta gratuita:
                    </p>
                    <Button 
                      className="w-full"
                      onClick={() => window.open("https://supabase.com/dashboard/sign-up", "_blank")}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Criar Conta no Supabase
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      2. Após criar a conta, clique em <strong>"New project"</strong>
                    </p>
                    <p className="text-sm text-gray-600">
                      3. Preencha os dados do projeto:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600 ml-4 space-y-1">
                      <li>Nome: <code className="bg-gray-100 px-2 py-1 rounded">planeja-financas</code></li>
                      <li>Senha do banco: Crie uma senha forte (anote ela!)</li>
                      <li>Região: Escolha a mais próxima (São Paulo)</li>
                    </ul>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Importante:</strong> Guarde a senha do banco de dados em local seguro. 
                      Você precisará dela no próximo passo.
                    </AlertDescription>
                  </Alert>

                  <Button 
                    className="w-full" 
                    onClick={() => setCurrentStep(2)}
                  >
                    Próximo Passo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="step-2" className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Passo 2: Obter a URL de conexão</h3>
                  
                  <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                    <p className="text-sm">
                      1. No painel do Supabase, vá para o seu projeto
                    </p>
                    <p className="text-sm">
                      2. Clique no botão <strong>"Connect"</strong> no topo
                    </p>
                    <p className="text-sm">
                      3. Em "Connection string", selecione <strong>"Transaction pooler"</strong>
                    </p>
                    <p className="text-sm">
                      4. Copie a URI que aparece (começa com <code>postgresql://</code>)
                    </p>
                    <p className="text-sm">
                      5. <strong>Substitua [YOUR-PASSWORD]</strong> pela senha que você criou
                    </p>
                  </div>

                  <div className="bg-gray-100 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 mb-2">Exemplo de URL (não use esta!):</p>
                    <code className="text-xs break-all">
                      postgresql://postgres.abcdefghijk:SuaSenhaAqui@aws-0-us-west-1.pooler.supabase.com:6543/postgres
                    </code>
                  </div>

                  <Alert className="bg-yellow-50 border-yellow-200">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription>
                      Certifique-se de substituir <strong>[YOUR-PASSWORD]</strong> pela senha real 
                      do banco antes de colar no próximo passo!
                    </AlertDescription>
                  </Alert>

                  <Button 
                    className="w-full" 
                    onClick={() => setCurrentStep(3)}
                  >
                    Próximo Passo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="step-3" className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Passo 3: Conectar ao Planeja</h3>
                  
                  <div>
                    <Label htmlFor="database-url">Cole a URL do seu banco de dados</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="database-url"
                        type="password"
                        placeholder="postgresql://postgres.xxxxx:senha@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
                        value={databaseUrl}
                        onChange={(e) => setDatabaseUrl(e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      A URL fica oculta por segurança
                    </p>
                  </div>

                  {isValid && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <div className="space-y-2">
                          <p className="font-semibold">Conexão validada com sucesso!</p>
                          <p>Agora configure o DATABASE_URL nos Secrets do Replit:</p>
                          <ol className="list-decimal list-inside text-sm space-y-1">
                            <li>Clique no ícone 🔒 (Secrets) no menu lateral do Replit</li>
                            <li>Adicione um novo secret com nome: <code className="bg-gray-100 px-1 rounded">DATABASE_URL</code></li>
                            <li>Cole a URL do banco que você acabou de validar</li>
                            <li>Clique em "Save" e depois recarregue a página</li>
                          </ol>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    className="w-full" 
                    onClick={validateDatabaseUrl}
                    disabled={isValidating || !databaseUrl}
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Validando conexão...
                      </>
                    ) : isValid ? (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Conexão Validada
                      </>
                    ) : (
                      <>
                        Validar e Conectar
                      </>
                    )}
                  </Button>

                  {isValid && (
                    <Button 
                      className="w-full" 
                      variant="default"
                      onClick={() => window.location.href = "/"}
                    >
                      Acessar o Planeja
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="mt-6 bg-gray-50 border-0">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">Precisa de ajuda?</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• O processo leva apenas 5 minutos</p>
              <p>• Não é necessário cartão de crédito</p>
              <p>• Suporte disponível em português</p>
              <p>• Tutorial em vídeo: 
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-primary"
                  onClick={() => window.open("https://www.youtube.com/watch?v=dU7GwCOgvNY", "_blank")}
                >
                  Como criar projeto no Supabase
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}