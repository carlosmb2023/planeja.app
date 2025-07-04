import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import Charts from "@/components/charts";
import { useQuery } from "@tanstack/react-query";
import { authManager } from "@/lib/auth";
import BottomNavigation from "@/components/bottom-navigation";

export default function Analytics() {
  const { data: dashboardData } = useQuery({
    queryKey: ["/api/dashboard/summary"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/summary", {
        headers: authManager.getAuthHeader(),
      });
      if (!response.ok) throw new Error("Failed to fetch dashboard data");
      return response.json();
    },
  });

  const { data: transactions } = useQuery({
    queryKey: ["/api/transactions"],
    queryFn: async () => {
      const response = await fetch("/api/transactions", {
        headers: authManager.getAuthHeader(),
      });
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
  });

  // Calculate monthly savings rate
  const savingsRate = dashboardData 
    ? ((dashboardData.monthlyIncome - dashboardData.monthlyExpenses) / dashboardData.monthlyIncome * 100).toFixed(1)
    : 0;

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
                  <span className="text-white text-xl font-bold">📊</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                    Análises Planeja
                  </h1>
                  <p className="text-sm text-blue-600 font-medium">Inteligência financeira avançada</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taxa de Poupança</p>
                  <p className="text-2xl font-bold text-dark-bg mt-1">{savingsRate}%</p>
                </div>
                <div className="w-12 h-12 bg-accent-green/10 rounded-xl flex items-center justify-center">
                  <PieChart className="h-6 w-6 text-accent-green" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Média de Gastos Diários</p>
                  <p className="text-2xl font-bold text-dark-bg mt-1">
                    R$ {dashboardData ? (dashboardData.monthlyExpenses / 30).toFixed(2).replace('.', ',') : '0,00'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Transações Este Mês</p>
                  <p className="text-2xl font-bold text-dark-bg mt-1">
                    {transactions ? transactions.filter((t: any) => {
                      const date = new Date(t.date);
                      const now = new Date();
                      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                    }).length : 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <Charts />

        {/* Spending by Category Table */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="font-montserrat text-lg font-semibold text-dark-bg">
              Gastos por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions && transactions
                .filter((t: any) => t.type === 'expense')
                .reduce((acc: any[], t: any) => {
                  const existing = acc.find(item => item.categoryId === t.categoryId);
                  if (existing) {
                    existing.total += parseFloat(t.amount);
                    existing.count += 1;
                  } else {
                    acc.push({
                      categoryId: t.categoryId,
                      description: t.description,
                      total: parseFloat(t.amount),
                      count: 1
                    });
                  }
                  return acc;
                }, [])
                .sort((a: any, b: any) => b.total - a.total)
                .slice(0, 5)
                .map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-dark-bg">Categoria {item.categoryId}</p>
                      <p className="text-sm text-gray-600">{item.count} transações</p>
                    </div>
                    <p className="font-semibold text-dark-bg">
                      R$ {item.total.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </main>
      
      <BottomNavigation />
    </div>
  );
}