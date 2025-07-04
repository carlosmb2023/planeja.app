import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Calculator, TrendingUp, DollarSign, PiggyBank, AlertTriangle, Info } from "lucide-react";
import BottomNavigation from "@/components/bottom-navigation";

interface SimulationResult {
  monthlyRetirement?: number;
  requiredMonthlyContribution?: number;
  totalAccumulated: number;
  totalContributed: number;
  totalEarnings: number;
  projectionData: YearlyProjection[];
}

interface YearlyProjection {
  year: number;
  age: number;
  annualContribution: number;
  earnings: number;
  accumulated: number;
}

export default function RetirementSimulator() {
  const [simulationType, setSimulationType] = useState<"income" | "contribution">("income");
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(65);
  const [initialContribution, setInitialContribution] = useState(0);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [desiredMonthlyIncome, setDesiredMonthlyIncome] = useState(5000);
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  // Taxa CDI conservadora (85% do CDI)
  const ANNUAL_CDI_RATE = 11.65; // Taxa CDI anual atual
  const CONSERVATIVE_CDI_PERCENTAGE = 0.85;
  const ADMIN_FEE = 1.5; // Taxa de administração anual
  const LOADING_FEE = 0.5; // Taxa de carregamento
  const LIFE_EXPECTANCY = 85; // Expectativa de vida

  const calculateRetirement = () => {
    setIsCalculating(true);
    
    // Simula delay de cálculo
    setTimeout(() => {
      const effectiveAnnualRate = (ANNUAL_CDI_RATE * CONSERVATIVE_CDI_PERCENTAGE - ADMIN_FEE) / 100;
      const monthlyRate = Math.pow(1 + effectiveAnnualRate, 1/12) - 1;
      const contributionYears = retirementAge - currentAge;
      const contributionMonths = contributionYears * 12;
      
      let capital = initialContribution;
      let totalContributed = initialContribution;
      let totalEarnings = 0;
      const projectionData: YearlyProjection[] = [];
      
      if (simulationType === "income") {
        // Calcula valor acumulado com contribuição mensal definida
        const effectiveMonthlyContribution = monthlyContribution * (1 - LOADING_FEE / 100);
        
        for (let year = 1; year <= contributionYears; year++) {
          let annualContribution = 0;
          let annualEarnings = 0;
          
          for (let month = 1; month <= 12; month++) {
            capital += effectiveMonthlyContribution;
            annualContribution += effectiveMonthlyContribution;
            totalContributed += effectiveMonthlyContribution;
            
            const monthlyEarnings = capital * monthlyRate;
            capital += monthlyEarnings;
            annualEarnings += monthlyEarnings;
            totalEarnings += monthlyEarnings;
          }
          
          projectionData.push({
            year: new Date().getFullYear() + year,
            age: currentAge + year,
            annualContribution,
            earnings: annualEarnings,
            accumulated: capital
          });
        }
        
        // Calcula renda mensal na aposentadoria
        const retirementYears = LIFE_EXPECTANCY - retirementAge;
        const retirementMonths = retirementYears * 12;
        const monthlyRetirement = capital / retirementMonths;
        
        setResult({
          monthlyRetirement,
          totalAccumulated: capital,
          totalContributed,
          totalEarnings,
          projectionData
        });
      } else {
        // Calcula contribuição necessária para renda desejada
        const retirementYears = LIFE_EXPECTANCY - retirementAge;
        const retirementMonths = retirementYears * 12;
        const requiredCapital = desiredMonthlyIncome * retirementMonths;
        
        // Fórmula de matemática financeira para calcular PMT
        const adjustedCapital = requiredCapital - initialContribution * Math.pow(1 + monthlyRate, contributionMonths);
        const monthlyContributionRequired = (adjustedCapital * monthlyRate) / 
                                          (Math.pow(1 + monthlyRate, contributionMonths) - 1);
        const requiredMonthlyContribution = monthlyContributionRequired / (1 - LOADING_FEE / 100);
        
        // Recalcula projeção com contribuição sugerida
        capital = initialContribution;
        totalContributed = initialContribution;
        totalEarnings = 0;
        const effectiveMonthlyContribution = requiredMonthlyContribution * (1 - LOADING_FEE / 100);
        
        for (let year = 1; year <= contributionYears; year++) {
          let annualContribution = 0;
          let annualEarnings = 0;
          
          for (let month = 1; month <= 12; month++) {
            capital += effectiveMonthlyContribution;
            annualContribution += effectiveMonthlyContribution;
            totalContributed += effectiveMonthlyContribution;
            
            const monthlyEarnings = capital * monthlyRate;
            capital += monthlyEarnings;
            annualEarnings += monthlyEarnings;
            totalEarnings += monthlyEarnings;
          }
          
          projectionData.push({
            year: new Date().getFullYear() + year,
            age: currentAge + year,
            annualContribution,
            earnings: annualEarnings,
            accumulated: capital
          });
        }
        
        setResult({
          requiredMonthlyContribution,
          totalAccumulated: capital,
          totalContributed,
          totalEarnings,
          projectionData
        });
      }
      
      setIsCalculating(false);
    }, 1500);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
                <Calculator className="text-white h-4 w-4" />
              </div>
              <h1 className="font-montserrat text-lg font-semibold text-dark-bg">
                Simulador de Previdência
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {/* Introduction */}
        <Card className="mb-6 bg-gradient-to-r from-primary to-primary-dark text-white">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-2">Planeje seu Futuro com Segurança</h2>
            <p className="text-white/90">
              Simule sua previdência privada seguindo as regras da SUSEP com perfil conservador.
              Descubra quanto precisa contribuir ou quanto receberá na aposentadoria.
            </p>
          </CardContent>
        </Card>

        {/* Simulator Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Dados da Simulação</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={simulationType} onValueChange={(value) => setSimulationType(value as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="income">Quanto vou receber?</TabsTrigger>
                <TabsTrigger value="contribution">Quanto devo investir?</TabsTrigger>
              </TabsList>
              
              <TabsContent value="income" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currentAge">Idade Atual</Label>
                    <Input
                      id="currentAge"
                      type="number"
                      value={currentAge}
                      onChange={(e) => setCurrentAge(Number(e.target.value))}
                      min={18}
                      max={80}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="retirementAge">Idade de Aposentadoria</Label>
                    <Input
                      id="retirementAge"
                      type="number"
                      value={retirementAge}
                      onChange={(e) => setRetirementAge(Number(e.target.value))}
                      min={currentAge + 1}
                      max={90}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="initialContribution">Aporte Inicial (opcional)</Label>
                    <Input
                      id="initialContribution"
                      type="number"
                      value={initialContribution}
                      onChange={(e) => setInitialContribution(Number(e.target.value))}
                      min={0}
                      placeholder="R$ 0,00"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="monthlyContribution">Contribuição Mensal</Label>
                    <Input
                      id="monthlyContribution"
                      type="number"
                      value={monthlyContribution}
                      onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                      min={50}
                      placeholder="R$ 500,00"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="contribution" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currentAge2">Idade Atual</Label>
                    <Input
                      id="currentAge2"
                      type="number"
                      value={currentAge}
                      onChange={(e) => setCurrentAge(Number(e.target.value))}
                      min={18}
                      max={80}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="retirementAge2">Idade de Aposentadoria</Label>
                    <Input
                      id="retirementAge2"
                      type="number"
                      value={retirementAge}
                      onChange={(e) => setRetirementAge(Number(e.target.value))}
                      min={currentAge + 1}
                      max={90}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="initialContribution2">Aporte Inicial (opcional)</Label>
                    <Input
                      id="initialContribution2"
                      type="number"
                      value={initialContribution}
                      onChange={(e) => setInitialContribution(Number(e.target.value))}
                      min={0}
                      placeholder="R$ 0,00"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="desiredIncome">Renda Mensal Desejada</Label>
                    <Input
                      id="desiredIncome"
                      type="number"
                      value={desiredMonthlyIncome}
                      onChange={(e) => setDesiredMonthlyIncome(Number(e.target.value))}
                      min={500}
                      placeholder="R$ 5.000,00"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <Button 
              onClick={calculateRetirement} 
              className="w-full mt-6"
              disabled={isCalculating}
            >
              {isCalculating ? (
                <>Calculando...</>
              ) : (
                <>
                  <Calculator className="mr-2 h-4 w-4" />
                  Simular Previdência
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">
                        {simulationType === "income" ? "Renda Mensal Projetada" : "Contribuição Necessária"}
                      </p>
                      <p className="text-3xl font-bold mt-2">
                        {simulationType === "income" 
                          ? formatCurrency(result.monthlyRetirement || 0)
                          : formatCurrency(result.requiredMonthlyContribution || 0)}
                      </p>
                    </div>
                    <DollarSign className="h-12 w-12 text-green-200" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Capital Acumulado</p>
                      <p className="text-3xl font-bold mt-2">
                        {formatCurrency(result.totalAccumulated)}
                      </p>
                    </div>
                    <PiggyBank className="h-12 w-12 text-blue-200" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Rendimentos Totais</p>
                      <p className="text-3xl font-bold mt-2">
                        {formatCurrency(result.totalEarnings)}
                      </p>
                    </div>
                    <TrendingUp className="h-12 w-12 text-purple-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Evolução do Patrimônio</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={result.projectionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(value) => formatCurrency(value).replace('R$', '')} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="accumulated" 
                      name="Saldo Acumulado" 
                      stroke="#00AE9D" 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="annualContribution" 
                      name="Contribuição Anual" 
                      stroke="#49479D" 
                      strokeDasharray="5 5"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="earnings" 
                      name="Rendimento Anual" 
                      stroke="#7DB61C"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Detailed Table */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Projeção Detalhada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ano</TableHead>
                        <TableHead>Idade</TableHead>
                        <TableHead>Contribuição Anual</TableHead>
                        <TableHead>Rendimento</TableHead>
                        <TableHead>Saldo Acumulado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.projectionData.slice(0, 10).map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.year}</TableCell>
                          <TableCell>{row.age}</TableCell>
                          <TableCell>{formatCurrency(row.annualContribution)}</TableCell>
                          <TableCell>{formatCurrency(row.earnings)}</TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(row.accumulated)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-gray-700">
                <strong>Importante:</strong> Esta simulação segue as regras da SUSEP para planos PGBL/VGBL com perfil conservador.
                Os valores são estimativas baseadas em {CONSERVATIVE_CDI_PERCENTAGE * 100}% do CDI e podem variar conforme as condições de mercado.
                Consulte um especialista para uma análise personalizada.
              </AlertDescription>
            </Alert>
          </>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}