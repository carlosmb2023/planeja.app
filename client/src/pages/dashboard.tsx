import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { authManager } from "@/lib/auth";
import FinancialCards from "@/components/financial-cards";
import Charts from "@/components/charts";
import TransactionModal from "@/components/transaction-modal";
import BottomNavigation from "@/components/bottom-navigation";
import AIAnalyst from "@/components/ai-analyst";
import NotificationSystem from "@/components/notification-system";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Bell, Plus, BarChart3, FileUp, GraduationCap, Folder, 
  Users, TrendingUp, Calculator, Sparkles, Shield, Building2,
  Target, CreditCard, PieChart, Activity, Zap
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const user = authManager.getUser();

  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["/api/dashboard/summary"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/summary", {
        headers: authManager.getAuthHeader(),
      });
      if (!response.ok) throw new Error("Failed to fetch dashboard data");
      return response.json();
    },
  });

  const { data: recentTransactions, isLoading: isTransactionsLoading } = useQuery({
    queryKey: ["/api/transactions/recent"],
    queryFn: async () => {
      const response = await fetch("/api/transactions/recent?limit=5", {
        headers: authManager.getAuthHeader(),
      });
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories", {
        headers: authManager.getAuthHeader(),
      });
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  const retirementProgress = dashboardData?.retirementTarget 
    ? (parseFloat(dashboardData.retirementSavings) / parseFloat(dashboardData.retirementTarget)) * 100
    : 0;

  const yearsToGoal = dashboardData?.monthlyContribution && dashboardData?.retirementTarget
    ? Math.max(0, (parseFloat(dashboardData.retirementTarget) - parseFloat(dashboardData.retirementSavings)) / (parseFloat(dashboardData.monthlyContribution) * 12))
    : 0;

  const handleLogout = () => {
    authManager.logout();
    window.location.reload();
  };

  if (isDashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 float-animation">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <p className="text-lg font-medium text-gray-700">Carregando Planeja...</p>
          <p className="text-sm text-gray-500 mt-1">Preparando seu painel financeiro</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      {/* Header Moderno */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
                <PiggyBank className="text-white h-4 w-4" />
              </div>
              <h1 className="font-montserrat text-lg font-semibold text-dark-bg">
                Planeja
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationSystem />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-8 h-8 bg-primary rounded-full flex items-center justify-center p-0"
              >
                <span className="text-white text-sm font-semibold">
                  {user?.firstName?.charAt(0) || 'U'}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="font-montserrat text-2xl font-bold text-dark-bg mb-2">
            Olá, {user?.firstName}! 👋
          </h2>
          <p className="text-gray-600">Aqui está um resumo das suas finanças hoje</p>
        </div>

        {/* Financial Overview Cards */}
        <FinancialCards data={dashboardData} />

        {/* Acesso Rápido */}
        <div className="mb-8">
          <h3 className="font-montserrat text-lg font-semibold text-dark-bg mb-4">Acesso Rápido</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            <Button
              variant="outline"
              className="bg-white rounded-2xl p-4 h-auto flex flex-col items-center space-y-3 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 group border-0"
              onClick={() => setIsTransactionModalOpen(true)}
            >
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                <Plus className="text-emerald-600 h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-dark-bg text-center">Receitas</p>
            </Button>

            <Button
              variant="outline"
              className="bg-white rounded-2xl p-4 h-auto flex flex-col items-center space-y-3 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 group border-0"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <Folder className="text-orange-600 h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-dark-bg text-center">Categorias</p>
            </Button>

            <Link href="/assets" className="block">
              <Button
                variant="outline"
                className="bg-white rounded-2xl p-4 h-auto flex flex-col items-center space-y-3 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 group border-0 w-full"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Home className="text-blue-600 h-5 w-5" />
                </div>
                <p className="text-xs font-medium text-dark-bg text-center">Bens</p>
              </Button>
            </Link>

            <Link href="/assets?tab=heirs" className="block">
              <Button
                variant="outline"
                className="bg-white rounded-2xl p-4 h-auto flex flex-col items-center space-y-3 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 group border-0 w-full"
              >
                <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center group-hover:bg-pink-200 transition-colors">
                  <Users className="text-pink-600 h-5 w-5" />
                </div>
                <p className="text-xs font-medium text-dark-bg text-center">Herdeiros</p>
              </Button>
            </Link>

            <Link href="/assets?tab=investments" className="block">
              <Button
                variant="outline"
                className="bg-white rounded-2xl p-4 h-auto flex flex-col items-center space-y-3 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 group border-0 w-full"
              >
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <TrendingUp className="text-indigo-600 h-5 w-5" />
                </div>
                <p className="text-xs font-medium text-dark-bg text-center">Investimentos</p>
              </Button>
            </Link>

            <Link href="/retirement-simulator" className="block">
              <Button
                variant="outline"
                className="bg-white rounded-2xl p-4 h-auto flex flex-col items-center space-y-3 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 group border-0 w-full"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <Calculator className="text-purple-600 h-5 w-5" />
                </div>
                <p className="text-xs font-medium text-dark-bg text-center">Previdência</p>
              </Button>
            </Link>

            <Link href="/education" className="block">
              <Button
                variant="outline"
                className="bg-white rounded-2xl p-4 h-auto flex flex-col items-center space-y-3 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 group border-0 w-full"
              >
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                  <GraduationCap className="text-yellow-600 h-5 w-5" />
                </div>
                <p className="text-xs font-medium text-dark-bg text-center">Educação</p>
              </Button>
            </Link>
          </div>
        </div>

        {/* Charts Section */}
        <Charts />

        {/* AI Analyst */}
        <div className="mb-8">
          <AIAnalyst data={dashboardData} />
        </div>

        {/* Recent Transactions */}
        <Card className="shadow-sm mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-montserrat text-lg font-semibold text-dark-bg">
                Transações Recentes
              </h3>
              <Button variant="ghost" className="text-primary hover:text-primary-dark text-sm font-medium">
                Ver todas
              </Button>
            </div>
          </div>
          <CardContent className="p-0">
            {isTransactionsLoading ? (
              <div className="p-4 text-center">
                <p>Carregando transações...</p>
              </div>
            ) : !recentTransactions || recentTransactions.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p>Nenhuma transação encontrada.</p>
                <p className="text-sm">Adicione sua primeira transação para começar!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {recentTransactions.map((transaction: any) => {
                  const category = categories?.find((c: any) => c.id === transaction.categoryId);
                  const amount = parseFloat(transaction.amount);
                  const isIncome = transaction.type === 'income';
                  
                  return (
                    <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${
                            isIncome ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            <span className={`text-sm ${isIncome ? 'text-green-500' : 'text-red-500'}`}>
                              {category?.icon || '💰'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-dark-bg">{transaction.description}</p>
                            <p className="text-sm text-gray-600">
                              {category?.name || 'Outros'} • {new Date(transaction.date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <p className={`font-semibold ${isIncome ? 'text-green-500' : 'text-red-500'}`}>
                          {isIncome ? '+' : '-'}R$ {amount.toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Retirement Progress */}
        {dashboardData?.retirementTarget && (
          <Card className="shadow-sm mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-montserrat text-lg font-semibold text-dark-bg">
                  Meta de Aposentadoria
                </h3>
                <span className="text-accent-purple text-sm font-medium">
                  {Math.round(retirementProgress)}% concluída
                </span>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    R$ {parseFloat(dashboardData.retirementSavings).toFixed(2).replace('.', ',')} de R$ {parseFloat(dashboardData.retirementTarget).toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-sm font-medium text-accent-purple">
                    Faltam R$ {(parseFloat(dashboardData.retirementTarget) - parseFloat(dashboardData.retirementSavings)).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <Progress value={retirementProgress} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-dark-bg">
                    R$ {parseFloat(dashboardData.monthlyContribution || 0).toFixed(0)}
                  </p>
                  <p className="text-sm text-gray-600">Contribuição Mensal</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-dark-bg">
                    {yearsToGoal.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600">Anos para Meta</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Educational Content */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-montserrat text-lg font-semibold text-dark-bg">
                Conteúdo Educacional
              </h3>
              <Button variant="ghost" className="text-primary hover:text-primary-dark text-sm font-medium">
                Ver todos
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative overflow-hidden rounded-xl">
                <img
                  src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=300"
                  alt="Financial education charts and planning"
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h4 className="font-semibold text-white mb-1">Planejamento Financeiro Básico</h4>
                  <p className="text-white/90 text-sm">5 min • Iniciante</p>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl">
                <img
                  src="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=300"
                  alt="Investment planning workspace with documents and calculator"
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h4 className="font-semibold text-white mb-1">Investimentos para Cooperados</h4>
                  <p className="text-white/90 text-sm">8 min • Intermediário</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNavigation />
      <TransactionModal 
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
      />
    </div>
  );
}
