import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Download, TrendingUp, TrendingDown, DollarSign, Calendar, FileText, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { authManager } from "@/lib/auth";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import BottomNavigation from "@/components/bottom-navigation";

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState("3m");
  const [reportType, setReportType] = useState("summary");

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

  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/transactions"],
    queryFn: async () => {
      const response = await fetch("/api/transactions", {
        headers: authManager.getAuthHeader(),
      });
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
  });

  const { data: assets = [] } = useQuery({
    queryKey: ["/api/assets"],
    queryFn: async () => {
      const response = await fetch("/api/assets", {
        headers: authManager.getAuthHeader(),
      });
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Processar dados para gráficos
  const processMonthlyData = () => {
    const months = parseInt(selectedPeriod.replace('m', ''));
    const monthlyData = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthTransactions = transactions.filter((t: any) => {
        const transactionDate = new Date(t.date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });
      
      const income = monthTransactions
        .filter((t: any) => t.type === 'income')
        .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
      
      const expenses = monthTransactions
        .filter((t: any) => t.type === 'expense')
        .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
      
      monthlyData.push({
        month: format(date, "MMM/yy", { locale: ptBR }),
        receitas: income,
        despesas: expenses,
        saldo: income - expenses
      });
    }
    
    return monthlyData;
  };

  const processCategoryData = () => {
    const categoryTotals: { [key: string]: number } = {};
    
    transactions
      .filter((t: any) => t.type === 'expense')
      .forEach((t: any) => {
        if (categoryTotals[t.category?.name || 'Outros']) {
          categoryTotals[t.category.name] += parseFloat(t.amount);
        } else {
          categoryTotals[t.category?.name || 'Outros'] = parseFloat(t.amount);
        }
      });
    
    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
      percentage: ((value / Object.values(categoryTotals).reduce((a, b) => a + b, 0)) * 100).toFixed(1)
    }));
  };

  const processAssetData = () => {
    const assetTypes: { [key: string]: number } = {};
    
    assets.forEach((asset: any) => {
      if (assetTypes[asset.type]) {
        assetTypes[asset.type] += parseFloat(asset.value);
      } else {
        assetTypes[asset.type] = parseFloat(asset.value);
      }
    });
    
    return Object.entries(assetTypes).map(([name, value]) => ({
      name,
      value,
      percentage: ((value / Object.values(assetTypes).reduce((a, b) => a + b, 0)) * 100).toFixed(1)
    }));
  };

  const monthlyData = processMonthlyData();
  const categoryData = processCategoryData();
  const assetData = processAssetData();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const exportToPDF = () => {
    // Aqui seria implementada a exportação real para PDF
    const reportData = {
      period: selectedPeriod,
      generatedAt: new Date().toISOString(),
      summary: dashboardData,
      monthlyData,
      categoryData,
      assetData,
      transactions: transactions.slice(0, 50) // Últimas 50 transações
    };
    
    console.log('Relatório gerado:', reportData);
    
    // Simular download
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-financeiro-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const calculateGrowth = (data: any[]) => {
    if (data.length < 2) return 0;
    const current = data[data.length - 1]?.saldo || 0;
    const previous = data[data.length - 2]?.saldo || 0;
    if (previous === 0) return 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  const totalAssets = assets.reduce((sum: number, asset: any) => sum + parseFloat(asset.value), 0);
  const totalIncome = monthlyData.reduce((sum: number, month: any) => sum + month.receitas, 0);
  const totalExpenses = monthlyData.reduce((sum: number, month: any) => sum + month.despesas, 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
  const growth = calculateGrowth(monthlyData);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="p-2 -ml-2 text-gray-600 hover:text-primary">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="font-montserrat text-lg font-semibold text-dark-bg ml-4">
                Relatórios Financeiros
              </h1>
            </div>
            <div className="flex gap-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3m">3 meses</SelectItem>
                  <SelectItem value="6m">6 meses</SelectItem>
                  <SelectItem value="12m">12 meses</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportToPDF}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Ativos</p>
                  <p className="text-2xl font-bold">
                    R$ {totalAssets.toLocaleString('pt-BR')}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Taxa de Poupança</p>
                  <p className="text-2xl font-bold">
                    {savingsRate.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Crescimento</p>
                  <p className={`text-2xl font-bold ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                  </p>
                </div>
                {growth >= 0 ? 
                  <TrendingUp className="h-8 w-8 text-green-600" /> : 
                  <TrendingDown className="h-8 w-8 text-red-600" />
                }
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Transações</p>
                  <p className="text-2xl font-bold">
                    {transactions.length}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="cashflow" className="space-y-6">
          <TabsList>
            <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
            <TabsTrigger value="categories">Por Categoria</TabsTrigger>
            <TabsTrigger value="assets">Patrimônio</TabsTrigger>
            <TabsTrigger value="detailed">Detalhado</TabsTrigger>
          </TabsList>

          {/* Aba Fluxo de Caixa */}
          <TabsContent value="cashflow">
            <Card>
              <CardHeader>
                <CardTitle>Evolução Financeira Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [
                        `R$ ${value.toLocaleString('pt-BR')}`, 
                        ''
                      ]}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="receitas" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="Receitas"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="despesas" 
                      stroke="#EF4444" 
                      strokeWidth={2}
                      name="Despesas"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="saldo" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="Saldo"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Categorias */}
          <TabsContent value="categories">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gastos por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ranking de Categorias</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categoryData
                      .sort((a, b) => b.value - a.value)
                      .slice(0, 5)
                      .map((category, index) => (
                        <div key={category.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{index + 1}</Badge>
                            <span className="font-medium">{category.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              R$ {category.value.toLocaleString('pt-BR')}
                            </p>
                            <p className="text-sm text-gray-600">{category.percentage}%</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Aba Patrimônio */}
          <TabsContent value="assets">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição do Patrimônio</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={assetData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {assetData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Composição dos Ativos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assetData
                      .sort((a, b) => b.value - a.value)
                      .map((asset, index) => (
                        <div key={asset.name} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">{asset.name}</span>
                            <span className="font-semibold">
                              R$ {asset.value.toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <Progress value={parseFloat(asset.percentage)} className="h-2" />
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Aba Detalhado */}
          <TabsContent value="detailed">
            <Card>
              <CardHeader>
                <CardTitle>Análise Detalhada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Receita Média Mensal</h4>
                    <p className="text-2xl font-bold text-green-600">
                      R$ {(totalIncome / monthlyData.length).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold">Gasto Médio Mensal</h4>
                    <p className="text-2xl font-bold text-red-600">
                      R$ {(totalExpenses / monthlyData.length).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold">Economia Mensal</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      R$ {((totalIncome - totalExpenses) / monthlyData.length).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold">Maior Receita</h4>
                    <p className="text-xl font-bold">
                      R$ {Math.max(...monthlyData.map(m => m.receitas)).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold">Maior Gasto</h4>
                    <p className="text-xl font-bold">
                      R$ {Math.max(...monthlyData.map(m => m.despesas)).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold">Melhor Mês</h4>
                    <p className="text-xl font-bold">
                      {monthlyData.find(m => m.saldo === Math.max(...monthlyData.map(x => x.saldo)))?.month || 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation />
    </div>
  );
}
