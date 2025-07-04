import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Brain, TrendingUp, AlertTriangle, Lightbulb, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

interface FinancialData {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  retirementSavings: number;
  transactions: any[];
}

interface Insight {
  type: 'positive' | 'warning' | 'tip';
  title: string;
  description: string;
  icon: any;
}

export default function AIAnalyst({ data }: { data?: FinancialData }) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeFinances = () => {
    if (!data) return;
    
    setAnalyzing(true);
    const newInsights: Insight[] = [];

    // Análise de Gastos vs Receitas
    const savingsRate = data.monthlyIncome > 0 ? ((data.monthlyIncome - data.monthlyExpenses) / data.monthlyIncome) * 100 : 0;
    
    if (savingsRate < 10) {
      newInsights.push({
        type: 'warning',
        title: 'Taxa de Poupança Baixa',
        description: `Você está poupando apenas ${savingsRate.toFixed(1)}% da sua renda. Recomenda-se poupar pelo menos 20% para uma saúde financeira sólida. Considere revisar seus gastos mensais.`,
        icon: AlertTriangle
      });
    } else if (savingsRate >= 20) {
      newInsights.push({
        type: 'positive',
        title: 'Excelente Taxa de Poupança',
        description: `Parabéns! Você está poupando ${savingsRate.toFixed(1)}% da sua renda. Continue assim e considere aumentar seus investimentos.`,
        icon: TrendingUp
      });
    }

    // Análise de Aposentadoria
    if (data.retirementSavings > 0) {
      const monthlyContributionNeeded = data.retirementSavings * 0.04; // Regra dos 4%
      newInsights.push({
        type: 'tip',
        title: 'Progresso da Aposentadoria',
        description: `Com R$ ${data.retirementSavings.toLocaleString('pt-BR')} poupados, você poderia ter uma renda mensal de R$ ${monthlyContributionNeeded.toLocaleString('pt-BR')} na aposentadoria (regra dos 4%).`,
        icon: Lightbulb
      });
    }

    // Análise de Despesas
    if (data.monthlyExpenses > data.monthlyIncome * 0.8) {
      newInsights.push({
        type: 'warning',
        title: 'Gastos Elevados',
        description: `Seus gastos representam ${((data.monthlyExpenses / data.monthlyIncome) * 100).toFixed(1)}% da sua renda. Considere identificar áreas para reduzir custos.`,
        icon: AlertTriangle
      });
    }

    // Dicas baseadas em transações
    if (data.transactions && data.transactions.length > 0) {
      const recentTransactions = data.transactions.slice(0, 30); // Últimas 30 transações
      const expenseTransactions = recentTransactions.filter((t: any) => t.type === 'expense');
      
      if (expenseTransactions.length > 0) {
        const avgExpense = expenseTransactions.reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0) / expenseTransactions.length;
        
        newInsights.push({
          type: 'tip',
          title: 'Padrão de Gastos',
          description: `Sua despesa média é de R$ ${avgExpense.toLocaleString('pt-BR')}. Acompanhe regularmente seus gastos para manter o controle financeiro.`,
          icon: Lightbulb
        });
      }
    }

    // Dica de emergência
    const emergencyFund = data.monthlyExpenses * 6; // 6 meses de reserva
    if (data.totalBalance < emergencyFund) {
      newInsights.push({
        type: 'warning',
        title: 'Reserva de Emergência',
        description: `Recomenda-se ter 6 meses de gastos como reserva de emergência (R$ ${emergencyFund.toLocaleString('pt-BR')}). Você tem R$ ${data.totalBalance.toLocaleString('pt-BR')}.`,
        icon: AlertTriangle
      });
    }

    // Dica de investimentos
    if (savingsRate > 20 && data.totalBalance > emergencyFund) {
      newInsights.push({
        type: 'positive',
        title: 'Oportunidade de Investimento',
        description: `Com sua reserva de emergência completa e boa taxa de poupança, considere diversificar seus investimentos para acelerar o crescimento do patrimônio.`,
        icon: TrendingUp
      });
    }

    // Análise de Meta de Aposentadoria
    const monthlyRetirementContribution = data.monthlyIncome * 0.15; // 15% recomendado
    const currentContribution = data.retirementSavings / 12; // Estimativa mensal
    
    if (currentContribution < monthlyRetirementContribution * 0.8) {
      newInsights.push({
        type: 'warning',
        title: 'Aumente sua Contribuição para Aposentadoria',
        description: 'Considere aumentar sua contribuição mensal para garantir uma aposentadoria tranquila.',
        icon: AlertTriangle
      });
    }

    // Análise de Padrões de Gastos
    const expenseRatio = data.monthlyExpenses / data.monthlyIncome;
    if (expenseRatio > 0.8) {
      newInsights.push({
        type: 'warning',
        title: 'Gastos Elevados',
        description: 'Seus gastos representam mais de 80% da sua renda. Revise suas despesas para encontrar oportunidades de economia.',
        icon: AlertTriangle
      });
    }

    // Dicas Gerais
    newInsights.push({
      type: 'tip',
      title: 'Diversifique seus Investimentos',
      description: 'Considere diversificar entre renda fixa e variável para otimizar seus retornos e reduzir riscos.',
      icon: Lightbulb
    });

    // Análise de Emergência
    const emergencyFund = data.totalBalance;
    const monthlyNeeds = data.monthlyExpenses;
    const emergencyMonths = emergencyFund / monthlyNeeds;
    
    if (emergencyMonths < 3) {
      newInsights.push({
        type: 'warning',
        title: 'Fundo de Emergência Insuficiente',
        description: `Você tem apenas ${emergencyMonths.toFixed(1)} meses de despesas em reserva. O ideal é ter entre 3-6 meses.`,
        icon: AlertTriangle
      });
    } else if (emergencyMonths >= 6) {
      newInsights.push({
        type: 'positive',
        title: 'Fundo de Emergência Sólido',
        description: `Excelente! Você tem ${emergencyMonths.toFixed(1)} meses de despesas em reserva.`,
        icon: TrendingUp
      });
    }

    // Simular delay para mostrar análise
    setTimeout(() => {
      setInsights(newInsights);
      setAnalyzing(false);
    }, 2000);
  };

  useEffect(() => {
    if (data) {
      analyzeFinances();
    }
  }, [data]);

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'positive': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-orange-600 bg-orange-100';
      case 'tip': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <Card className="shadow-lg border-0 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Brain className="h-6 w-6" />
          Analista IA Financeiro
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {analyzing ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="animate-pulse">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-gray-600">Analisando seus dados financeiros...</p>
            </div>
            <Progress value={66} className="animate-pulse" />
          </div>
        ) : insights.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Baseado em sua situação financeira atual, aqui estão minhas recomendações:
            </p>
            {insights.map((insight, index) => (
              <div key={index} className="flex gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getInsightColor(insight.type)}`}>
                  <insight.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
                  <p className="text-sm text-gray-600">{insight.description}</p>
                </div>
              </div>
            ))}
            
            <Button 
              onClick={analyzeFinances} 
              variant="outline" 
              className="w-full mt-4"
            >
              <Brain className="h-4 w-4 mr-2" />
              Reanalisar
            </Button>
          </div>
        ) : (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Clique para iniciar a análise</p>
            <Button 
              onClick={analyzeFinances} 
              className="mt-4"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Iniciar Análise IA
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}