import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { authManager } from "@/lib/auth";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function Charts() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  
  // Generate data for last 6 months
  const { data: monthlyData } = useQuery({
    queryKey: ["/api/transactions/monthly-summary"],
    queryFn: async () => {
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentYear, currentDate.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        
        const response = await fetch(`/api/transactions/monthly/${year}/${month}`, {
          headers: authManager.getAuthHeader(),
        });
        
        if (response.ok) {
          const transactions = await response.json();
          const expenses = transactions
            .filter((t: any) => t.type === 'expense')
            .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
          
          months.push({
            month: date.toLocaleDateString('pt-BR', { month: 'short' }),
            gastos: expenses
          });
        }
      }
      return months;
    },
  });

  const { data: categoryData } = useQuery({
    queryKey: ["/api/transactions/category-summary"],
    queryFn: async () => {
      const categoriesResponse = await fetch("/api/categories", {
        headers: authManager.getAuthHeader(),
      });
      const categories = await categoriesResponse.json();
      
      const transactionsResponse = await fetch("/api/transactions", {
        headers: authManager.getAuthHeader(),
      });
      const transactions = await transactionsResponse.json();
      
      const expenseTransactions = transactions.filter((t: any) => t.type === 'expense');
      const categoryTotals = new Map();
      
      expenseTransactions.forEach((transaction: any) => {
        const category = categories.find((c: any) => c.id === transaction.categoryId);
        if (category) {
          const current = categoryTotals.get(category.name) || 0;
          categoryTotals.set(category.name, current + parseFloat(transaction.amount));
        }
      });
      
      const totalExpenses = Array.from(categoryTotals.values()).reduce((sum, val) => sum + val, 0);
      
      return Array.from(categoryTotals.entries()).map(([name, value]) => ({
        name,
        value,
        percentage: totalExpenses > 0 ? Math.round((value / totalExpenses) * 100) : 0
      }));
    },
  });

  const COLORS = ['#00AE9D', '#7DB61C', '#49479D', '#C9D200', '#E5E7EB'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {/* Monthly Spending Chart */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-montserrat text-lg font-semibold text-dark-bg">
              Gastos Mensais
            </h3>
            <Select defaultValue="6months">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6months">Últimos 6 meses</SelectItem>
                <SelectItem value="year">Este ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="h-64">
            {monthlyData && monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis dataKey="month" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip 
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Gastos']}
                    labelStyle={{ color: '#333' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="gastos" 
                    stroke="#00AE9D" 
                    strokeWidth={3}
                    fill="rgba(0, 174, 157, 0.1)"
                    dot={{ fill: '#00AE9D', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Sem dados para exibir</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Distribution */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <h3 className="font-montserrat text-lg font-semibold text-dark-bg mb-6">
            Distribuição por Categoria
          </h3>
          <div className="h-64">
            {categoryData && categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                  >
                    {categoryData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Sem dados para exibir</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
