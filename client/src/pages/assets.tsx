import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authManager } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/bottom-navigation";

export default function Assets() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isHeirModalOpen, setIsHeirModalOpen] = useState(false);

  const { data: assets = [], isLoading: isAssetsLoading } = useQuery({
    queryKey: ["/api/assets"],
    queryFn: async () => {
      const response = await fetch("/api/assets", {
        headers: authManager.getAuthHeader(),
      });
      if (!response.ok) throw new Error("Failed to fetch assets");
      return response.json();
    },
  });

  const assetMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/assets", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      setIsAssetModalOpen(false);
      toast({
        title: "Bem cadastrado com sucesso!",
        description: "O bem foi adicionado à sua lista de patrimônio.",
      });
    },
  });

  const totalAssetValue = assets.reduce((sum: number, asset: any) => sum + parseFloat(asset.value || 0), 0);

  const assetCategories = [
    { name: "Imóveis", value: assets.filter((a: any) => a.type === "imovel").reduce((sum: number, a: any) => sum + parseFloat(a.value || 0), 0), icon: Building, color: "bg-blue-500" },
    { name: "Veículos", value: assets.filter((a: any) => a.type === "veiculo").reduce((sum: number, a: any) => sum + parseFloat(a.value || 0), 0), icon: Car, color: "bg-green-500" },
    { name: "Investimentos", value: assets.filter((a: any) => a.type === "investimento").reduce((sum: number, a: any) => sum + parseFloat(a.value || 0), 0), icon: TrendingUp, color: "bg-purple-500" },
    { name: "Outros", value: assets.filter((a: any) => a.type === "outro").reduce((sum: number, a: any) => sum + parseFloat(a.value || 0), 0), icon: DollarSign, color: "bg-orange-500" },
  ];

  const heirs = [
    { id: 1, name: "Maria Silva", relationship: "Cônjuge", percentage: 50 },
    { id: 2, name: "João Silva", relationship: "Filho", percentage: 25 },
    { id: 3, name: "Ana Silva", relationship: "Filha", percentage: 25 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="font-montserrat text-xl font-semibold text-dark-bg">
                Patrimônio e Sucessão
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        <Tabs defaultValue="assets" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="assets">Bens</TabsTrigger>
            <TabsTrigger value="heirs">Herdeiros</TabsTrigger>
            <TabsTrigger value="investments">Investimentos</TabsTrigger>
          </TabsList>

          <TabsContent value="assets" className="space-y-6">
            {/* Overview Card */}
            <Card className="shadow-lg border-0 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Patrimônio Total</h3>
                  <PieChart className="h-8 w-8 opacity-50" />
                </div>
                <p className="text-3xl font-bold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAssetValue)}
                </p>
                <p className="text-sm opacity-80 mt-2">{assets.length} bens cadastrados</p>
              </div>
            </Card>

            {/* Asset Categories */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {assetCategories.map((category) => (
                <Card key={category.name} className="shadow-md border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <category.icon className="h-5 w-5 text-gray-600" />
                      <Badge variant="secondary" className="text-xs">
                        {((category.value / totalAssetValue) * 100 || 0).toFixed(0)}%
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{category.name}</p>
                    <p className="font-semibold text-lg">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(category.value)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Assets List */}
            <Card className="shadow-lg border-0">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Seus Bens</CardTitle>
                <Dialog open={isAssetModalOpen} onOpenChange={setIsAssetModalOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Bem
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cadastrar Novo Bem</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      assetMutation.mutate({
                        name: formData.get('name'),
                        type: formData.get('type'),
                        value: formData.get('value'),
                        purchaseDate: formData.get('purchaseDate'),
                      });
                    }} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Nome do Bem</Label>
                        <Input id="name" name="name" required />
                      </div>
                      <div>
                        <Label htmlFor="type">Tipo</Label>
                        <Select name="type" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="imovel">Imóvel</SelectItem>
                            <SelectItem value="veiculo">Veículo</SelectItem>
                            <SelectItem value="investimento">Investimento</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="value">Valor Estimado</Label>
                        <Input id="value" name="value" type="number" step="0.01" required />
                      </div>
                      <div>
                        <Label htmlFor="purchaseDate">Data de Aquisição</Label>
                        <Input id="purchaseDate" name="purchaseDate" type="date" />
                      </div>
                      <Button type="submit" className="w-full">Cadastrar</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {isAssetsLoading ? (
                  <p className="text-center py-4">Carregando bens...</p>
                ) : assets.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Home className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Nenhum bem cadastrado ainda.</p>
                    <p className="text-sm">Comece adicionando seus imóveis, veículos e investimentos.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assets.map((asset: any) => (
                      <div key={asset.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            asset.type === 'imovel' ? 'bg-blue-100' :
                            asset.type === 'veiculo' ? 'bg-green-100' :
                            asset.type === 'investimento' ? 'bg-purple-100' :
                            'bg-orange-100'
                          }`}>
                            {asset.type === 'imovel' ? <Building className="h-5 w-5 text-blue-600" /> :
                             asset.type === 'veiculo' ? <Car className="h-5 w-5 text-green-600" /> :
                             asset.type === 'investimento' ? <TrendingUp className="h-5 w-5 text-purple-600" /> :
                             <DollarSign className="h-5 w-5 text-orange-600" />}
                          </div>
                          <div>
                            <p className="font-medium">{asset.name}</p>
                            <p className="text-sm text-gray-500">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(asset.value)}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="heirs" className="space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Herdeiros Cadastrados</CardTitle>
                <Dialog open={isHeirModalOpen} onOpenChange={setIsHeirModalOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Herdeiro
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cadastrar Herdeiro</DialogTitle>
                    </DialogHeader>
                    <form className="space-y-4">
                      <div>
                        <Label htmlFor="heirName">Nome Completo</Label>
                        <Input id="heirName" name="heirName" required />
                      </div>
                      <div>
                        <Label htmlFor="relationship">Parentesco</Label>
                        <Select name="relationship" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o parentesco" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="conjuge">Cônjuge</SelectItem>
                            <SelectItem value="filho">Filho(a)</SelectItem>
                            <SelectItem value="neto">Neto(a)</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="percentage">Percentual de Herança (%)</Label>
                        <Input id="percentage" name="percentage" type="number" min="0" max="100" required />
                      </div>
                      <Button type="submit" className="w-full">Cadastrar</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {heirs.map((heir) => (
                    <div key={heir.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-pink-600" />
                        </div>
                        <div>
                          <p className="font-medium">{heir.name}</p>
                          <p className="text-sm text-gray-500">{heir.relationship}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-primary/10 text-primary">
                          {heir.percentage}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Succession Planning Tips */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-pink-50 to-purple-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Dicas de Planejamento Sucessório
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Mantenha a documentação dos seus bens sempre atualizada</li>
                  <li>• Revise periodicamente a divisão de herança</li>
                  <li>• Considere fazer um testamento formal com auxílio jurídico</li>
                  <li>• Converse com seus herdeiros sobre suas decisões</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="investments" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Renda Fixa</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">CDB Banco X</span>
                      <span className="font-semibold">R$ 15.000,00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Tesouro Selic</span>
                      <span className="font-semibold">R$ 8.500,00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">LCI Banco Y</span>
                      <span className="font-semibold">R$ 12.000,00</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Renda Variável</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Ações</span>
                      <span className="font-semibold">R$ 5.000,00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Fundos Imobiliários</span>
                      <span className="font-semibold">R$ 7.200,00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">ETFs</span>
                      <span className="font-semibold">R$ 3.800,00</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Investment Performance */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Desempenho dos Investimentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Rendimento Total</span>
                      <span className="text-green-600 font-medium">+12.5%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '62%' }}></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">R$ 51.500</p>
                      <p className="text-sm text-gray-500">Total Investido</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">R$ 6.437</p>
                      <p className="text-sm text-gray-500">Rendimentos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">R$ 57.937</p>
                      <p className="text-sm text-gray-500">Valor Total</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNavigation />
    </div>
  );
}