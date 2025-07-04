import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authManager } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/bottom-navigation";

export default function Goals() {
  const [showForm, setShowForm] = useState(false);
  const [targetAmount, setTargetAmount] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: retirementGoal, isLoading } = useQuery({
    queryKey: ["/api/retirement/goal"],
    queryFn: async () => {
      const response = await fetch("/api/retirement/goal", {
        headers: authManager.getAuthHeader(),
      });
      if (!response.ok) return null;
      return response.json();
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: async (goalData: any) => {
      const response = await apiRequest('POST', '/api/retirement/goal', goalData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Meta criada com sucesso!",
        description: "Sua meta de aposentadoria foi definida.",
      });
      setShowForm(false);
      setTargetAmount("");
      setMonthlyContribution("");
      queryClient.invalidateQueries({ queryKey: ["/api/retirement/goal"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar meta",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async (goalData: any) => {
      const response = await apiRequest('PUT', '/api/retirement/goal', goalData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Meta atualizada!",
        description: "Sua contribuição mensal foi atualizada.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/retirement/goal"] });
    },
  });

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount.replace(',', '.'));
    const monthly = parseFloat(monthlyContribution.replace(',', '.'));
    
    if (isNaN(target) || isNaN(monthly) || target <= 0 || monthly <= 0) {
      toast({
        title: "Valores inválidos",
        description: "Insira valores válidos para a meta e contribuição.",
        variant: "destructive",
      });
      return;
    }

    createGoalMutation.mutate({
      targetAmount: target.toString(),
      monthlyContribution: monthly.toString(),
    });
  };

  const progress = retirementGoal
    ? (parseFloat(retirementGoal.currentAmount) / parseFloat(retirementGoal.targetAmount)) * 100
    : 0;

  const yearsToGoal = retirementGoal
    ? Math.max(0, (parseFloat(retirementGoal.targetAmount) - parseFloat(retirementGoal.currentAmount)) / (parseFloat(retirementGoal.monthlyContribution) * 12))
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/" className="p-2 -ml-2 text-gray-600 hover:text-primary">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-montserrat text-lg font-semibold text-dark-bg ml-4">
              Metas Financeiras
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Retirement Goal */}
        {!retirementGoal && !showForm ? (
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="font-montserrat text-lg font-semibold text-dark-bg mb-2">
                Defina sua Meta de Aposentadoria
              </h3>
              <p className="text-gray-600 mb-6">
                Estabeleça quanto deseja acumular para sua aposentadoria
              </p>
              <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary-dark">
                <Plus className="h-4 w-4 mr-2" />
                Criar Meta
              </Button>
            </CardContent>
          </Card>
        ) : showForm ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="font-montserrat text-lg font-semibold text-dark-bg">
                Nova Meta de Aposentadoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateGoal} className="space-y-4">
                <div>
                  <Label htmlFor="targetAmount" className="text-sm font-medium text-gray-700">
                    Valor da Meta (R$)
                  </Label>
                  <Input
                    id="targetAmount"
                    type="text"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="mt-2"
                    placeholder="500.000,00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="monthlyContribution" className="text-sm font-medium text-gray-700">
                    Contribuição Mensal (R$)
                  </Label>
                  <Input
                    id="monthlyContribution"
                    type="text"
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(e.target.value)}
                    className="mt-2"
                    placeholder="1.200,00"
                    required
                  />
                </div>
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={createGoalMutation.isPending}
                    className="bg-primary hover:bg-primary-dark"
                  >
                    {createGoalMutation.isPending ? "Criando..." : "Criar Meta"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="font-montserrat text-lg font-semibold text-dark-bg flex items-center justify-between">
                Meta de Aposentadoria
                <span className="text-accent-purple text-sm font-medium">
                  {Math.round(progress)}% concluída
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    R$ {parseFloat(retirementGoal.currentAmount).toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-sm font-medium text-dark-bg">
                    R$ {parseFloat(retirementGoal.targetAmount).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <Target className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-dark-bg">
                    R$ {parseFloat(retirementGoal.targetAmount).toFixed(0)}
                  </p>
                  <p className="text-sm text-gray-600">Meta Total</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <TrendingUp className="h-8 w-8 text-accent-green mx-auto mb-2" />
                  <p className="text-2xl font-bold text-dark-bg">
                    R$ {parseFloat(retirementGoal.monthlyContribution).toFixed(0)}
                  </p>
                  <p className="text-sm text-gray-600">Contribuição Mensal</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <Calendar className="h-8 w-8 text-accent-purple mx-auto mb-2" />
                  <p className="text-2xl font-bold text-dark-bg">
                    {yearsToGoal.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600">Anos para Meta</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-primary/5 rounded-xl">
                <p className="text-sm text-dark-bg">
                  <strong>Dica:</strong> Mantendo sua contribuição mensal de R$ {parseFloat(retirementGoal.monthlyContribution).toFixed(2).replace('.', ',')}, 
                  você alcançará sua meta em aproximadamente {yearsToGoal.toFixed(1)} anos.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Other Goals Section */}
        <Card>
          <CardHeader>
            <CardTitle className="font-montserrat text-lg font-semibold text-dark-bg">
              Outras Metas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-xl hover:border-primary transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-dark-bg">Fundo de Emergência</h4>
                  <span className="text-sm text-gray-600">Em breve</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Reserve 6 meses de despesas para emergências
                </p>
                <Progress value={0} className="h-2" />
              </div>

              <div className="p-4 border border-gray-200 rounded-xl hover:border-primary transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-dark-bg">Viagem de Férias</h4>
                  <span className="text-sm text-gray-600">Em breve</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Economize para sua próxima viagem
                </p>
                <Progress value={0} className="h-2" />
              </div>

              <div className="p-4 border border-gray-200 rounded-xl hover:border-primary transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-dark-bg">Educação dos Filhos</h4>
                  <span className="text-sm text-gray-600">Em breve</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Planeje o futuro educacional da família
                </p>
                <Progress value={0} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      
      <BottomNavigation />
    </div>
  );
}