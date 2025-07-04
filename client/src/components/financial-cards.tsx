import { Card, CardContent } from "@/components/ui/card";
import { Wallet, TrendingUp, TrendingDown, PieChart, DollarSign, PiggyBank, AlertCircle } from "lucide-react";

interface FinancialCardsProps {
  data?: {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    retirementSavings: number;
  };
}

export default function FinancialCards({ data }: FinancialCardsProps) {
  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const cards = [
    {
      title: "Orçamento",
      subtitle: "Controle Mensal",
      value: formatCurrency(data.totalBalance),
      icon: DollarSign,
      change: "+2.5%",
      changeColor: "text-emerald-600",
      bgColor: "bg-gradient-to-br from-emerald-50 to-emerald-100/50",
      iconColor: "text-emerald-600",
      borderGradient: "from-emerald-400 to-emerald-600"
    },
    {
      title: "Aposentadoria",
      subtitle: "Meta de Futuro",
      value: formatCurrency(data.retirementSavings),
      icon: PiggyBank,
      change: "Meta: 15%",
      changeColor: "text-purple-600",
      bgColor: "bg-gradient-to-br from-purple-50 to-purple-100/50",
      iconColor: "text-purple-600",
      borderGradient: "from-purple-400 to-purple-600"
    },
    {
      title: "Alertas Fiscais",
      subtitle: "Próximos Prazos",
      value: "3 pendentes",
      icon: AlertCircle,
      change: "Este mês",
      changeColor: "text-lime-600",
      bgColor: "bg-gradient-to-br from-lime-50 to-lime-100/50",
      iconColor: "text-lime-600",
      borderGradient: "from-lime-400 to-lime-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {cards.map((card, index) => (
        <Card key={index} className="group relative overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border-0">
          <div className={`absolute inset-0 ${card.bgColor} opacity-40`}></div>
          <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${card.borderGradient}`}></div>
          <CardContent className="relative p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-14 h-14 ${card.bgColor} rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                <card.icon className={`${card.iconColor} h-6 w-6`} />
              </div>
              <span className={`${card.changeColor} text-sm font-medium bg-white/80 px-2 py-1 rounded-full`}>
                {card.change}
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-gray-900 font-semibold text-lg">{card.title}</h3>
              <p className="text-gray-500 text-xs">{card.subtitle}</p>
              <p className="font-montserrat text-3xl font-bold text-gray-900 mt-2">
                {card.value}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
