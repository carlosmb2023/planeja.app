import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authManager } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import BottomNavigation from "@/components/bottom-navigation";

interface Insurance {
  id: number;
  type: string;
  insurer: string;
  policyNumber: string;
  coverage: string;
  premium: string;
  startDate: string;
  endDate: string;
  description?: string;
  notificationDays: number;
  isActive: boolean;
  createdAt: string;
}

export default function Insurances() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState<Insurance | null>(null);
  const [formData, setFormData] = useState({
    type: "",
    insurer: "",
    policyNumber: "",
    coverage: "",
    premium: "",
    startDate: "",
    endDate: "",
    description: "",
    notificationDays: 30,
    isActive: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: insurances = [], isLoading } = useQuery({
    queryKey: ["/api/insurances"],
    queryFn: async () => {
      const response = await fetch("/api/insurances", {
        headers: authManager.getAuthHeader(),
      });
      if (!response.ok) throw new Error("Failed to fetch insurances");
      return response.json();
    },
  });

  const insuranceMutation = useMutation({
    mutationFn: async (data: any) => {
      const method = editingInsurance ? "PUT" : "POST";
      const url = editingInsurance ? `/api/insurances/${editingInsurance.id}` : "/api/insurances";
      return apiRequest(url, method, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insurances"] });
      setIsModalOpen(false);
      setEditingInsurance(null);
      resetForm();
      toast({
        title: editingInsurance ? "Seguro atualizado!" : "Seguro cadastrado!",
        description: "As informações do seguro foram salvas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as informações do seguro.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/insurances/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insurances"] });
      toast({
        title: "Seguro removido!",
        description: "O seguro foi removido da sua lista.",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      type: "",
      insurer: "",
      policyNumber: "",
      coverage: "",
      premium: "",
      startDate: "",
      endDate: "",
      description: "",
      notificationDays: 30,
      isActive: true
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    insuranceMutation.mutate(formData);
  };

  const handleEdit = (insurance: Insurance) => {
    setEditingInsurance(insurance);
    setFormData({
      type: insurance.type,
      insurer: insurance.insurer,
      policyNumber: insurance.policyNumber,
      coverage: insurance.coverage,
      premium: insurance.premium,
      startDate: insurance.startDate.split('T')[0],
      endDate: insurance.endDate.split('T')[0],
      description: insurance.description || "",
      notificationDays: insurance.notificationDays,
      isActive: insurance.isActive
    });
    setIsModalOpen(true);
  };

  const getInsuranceIcon = (type: string) => {
    switch (type) {
      case 'life': return '💝';
      case 'property': return '🏠';
      case 'vehicle': return '🚗';
      case 'health': return '🏥';
      case 'travel': return '✈️';
      case 'business': return '🏢';
      default: return '🛡️';
    }
  };

  const getInsuranceTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'life': 'Vida',
      'property': 'Residencial',
      'vehicle': 'Veicular',
      'health': 'Saúde',
      'other': 'Outros'
    };
    return types[type] || type;
  };

  const getDaysUntilExpiry = (endDate: string) => {
    return differenceInDays(parseISO(endDate), new Date());
  };

  const getExpiryStatus = (insurance: Insurance) => {
    const daysLeft = getDaysUntilExpiry(insurance.endDate);
    if (daysLeft < 0) {
      return { color: "bg-red-100 text-red-800", label: "Vencido" };
    } else if (daysLeft <= insurance.notificationDays) {
      return { color: "bg-yellow-100 text-yellow-800", label: `${daysLeft} dias` };
    } else {
      return { color: "bg-green-100 text-green-800", label: "Em dia" };
    }
  };

  const totalPremium = insurances
    .filter((ins: Insurance) => ins.isActive)
    .reduce((sum: number, ins: Insurance) => sum + parseFloat(ins.premium), 0);

  const expiringInsurances = insurances.filter((ins: Insurance) => {
    const daysLeft = getDaysUntilExpiry(ins.endDate);
    return daysLeft >= 0 && daysLeft <= ins.notificationDays && ins.isActive;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <span className="text-2xl">🛡️</span>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-blue-200 rounded-lg w-32 mx-auto animate-pulse"></div>
            <div className="h-3 bg-blue-100 rounded-lg w-24 mx-auto animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 pb-24">
      {/* Header Moderno Bancário */}
      <header className="bg-white/90 backdrop-blur-xl shadow-lg border-b border-blue-200/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                  <span className="text-xl">←</span>
                </button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl font-bold">🛡️</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                    Seguros Planeja
                  </h1>
                  <p className="text-sm text-blue-600 font-medium">Proteja seu patrimônio com inteligência</p>
                </div>
              </div>
            </div>
            
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-medium">
                  <span className="mr-2">+</span>
                  Novo Seguro
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingInsurance ? "Editar Seguro" : "Novo Seguro"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Tipo de Seguro</Label>
                      <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="life">Vida</SelectItem>
                          <SelectItem value="property">Residencial</SelectItem>
                          <SelectItem value="vehicle">Veicular</SelectItem>
                          <SelectItem value="health">Saúde</SelectItem>
                          <SelectItem value="other">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="insurer">Seguradora</Label>
                      <Input
                        id="insurer"
                        value={formData.insurer}
                        onChange={(e) => setFormData({...formData, insurer: e.target.value})}
                        placeholder="Nome da seguradora"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="policyNumber">Número da Apólice</Label>
                      <Input
                        id="policyNumber"
                        value={formData.policyNumber}
                        onChange={(e) => setFormData({...formData, policyNumber: e.target.value})}
                        placeholder="Número da apólice"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="premium">Prêmio Mensal (R$)</Label>
                      <Input
                        id="premium"
                        type="number"
                        step="0.01"
                        value={formData.premium}
                        onChange={(e) => setFormData({...formData, premium: e.target.value})}
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="coverage">Cobertura</Label>
                    <Input
                      id="coverage"
                      value={formData.coverage}
                      onChange={(e) => setFormData({...formData, coverage: e.target.value})}
                      placeholder="Valor da cobertura (ex: R$ 100.000)"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Data de Início</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">Data de Vencimento</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="notificationDays">Alertar com antecedência (dias)</Label>
                      <Input
                        id="notificationDays"
                        type="number"
                        value={formData.notificationDays}
                        onChange={(e) => setFormData({...formData, notificationDays: parseInt(e.target.value)})}
                        min="1"
                        max="365"
                      />
                    </div>
                    <div className="flex items-center space-x-2 mt-6">
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                      />
                      <Label htmlFor="isActive">Ativo</Label>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição (opcional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Observações adicionais sobre o seguro"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={insuranceMutation.isPending}>
                      {insuranceMutation.isPending ? "Salvando..." : "Salvar"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alertas de vencimento */}
        {expiringInsurances.length > 0 && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Atenção!</strong> Você tem {expiringInsurances.length} seguro(s) próximo(s) do vencimento.
            </AlertDescription>
          </Alert>
        )}

        {/* Cards de Resumo Bancários Modernos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total de Prêmios</p>
                  <p className="text-2xl font-bold text-blue-700">
                    R$ {totalPremium.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">por mês</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-xl">💰</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Cobertura Total</p>
                  <p className="text-2xl font-bold text-green-700">
                    R$ {insurances.reduce((sum, ins) => sum + parseFloat(ins.coverage), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">em proteção</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-xl">🛡️</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Seguros Ativos</p>
                  <p className="text-2xl font-bold text-indigo-700">
                    {insurances.filter(ins => ins.isActive).length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">de {insurances.length} total</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-xl">📊</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de seguros modernizada */}
        <div className="space-y-4">
          {insurances.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardContent className="p-12 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">🛡️</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum seguro cadastrado</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Comece a proteger seu patrimônio cadastrando seus seguros e acompanhe vencimentos, prêmios e coberturas.
                </p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-medium"
                >
                  <span className="mr-2">+</span>
                  Adicionar Primeiro Seguro
                </button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {insurances.map((insurance: Insurance) => {
                const insuranceIcon = getInsuranceIcon(insurance.type);
                const expiryStatus = getExpiryStatus(insurance);
                const daysLeft = getDaysUntilExpiry(insurance.endDate);
                
                return (
                  <Card key={insurance.id} className={`bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-300 group ${!insurance.isActive ? "opacity-60" : ""}`}>
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300">
                            {insuranceIcon}
                          </div>
                          <div>
                            <CardTitle className="text-lg font-bold text-gray-900 mb-1">
                              {getInsuranceTypeLabel(insurance.type)}
                            </CardTitle>
                            <p className="text-sm text-gray-600">{insurance.insurer}</p>
                          </div>
                        </div>
                        {getStatusBadge(insurance)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">APÓLICE</p>
                          <p className="text-sm font-semibold text-gray-900">{insurance.policyNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">PRÊMIO MENSAL</p>
                          <p className="text-sm font-semibold text-blue-700">
                            R$ {parseFloat(insurance.premium).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">COBERTURA</p>
                          <p className="text-sm font-semibold text-green-700">{insurance.coverage}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">VENCIMENTO</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {format(parseISO(insurance.endDate), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </div>
                      </div>

                      {insurance.description && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs font-medium text-blue-600 mb-1">DESCRIÇÃO</p>
                          <p className="text-sm text-blue-800 line-clamp-2">{insurance.description}</p>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                        <button
                          onClick={() => handleEdit(insurance)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-sm"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(insurance.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-sm"
                        >
                          🗑️ Remover
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
