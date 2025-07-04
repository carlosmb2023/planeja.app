import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, PlayCircle, BookOpen, Award, Clock, Lock, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import BottomNavigation from "@/components/bottom-navigation";

export default function Education() {
  const courses = [
    {
      id: 1,
      title: "Introdução ao Planejamento Financeiro",
      description: "Aprenda os conceitos básicos de orçamento e poupança",
      duration: "45 min",
      modules: 6,
      progress: 100,
      completed: true,
      difficulty: "Iniciante",
      color: "bg-emerald-100",
      iconColor: "text-emerald-600"
    },
    {
      id: 2,
      title: "Investindo para o Futuro",
      description: "Entenda os diferentes tipos de investimentos",
      duration: "1h 30min",
      modules: 8,
      progress: 60,
      completed: false,
      difficulty: "Intermediário",
      color: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      id: 3,
      title: "Aposentadoria Tranquila",
      description: "Planeje sua aposentadoria com segurança",
      duration: "2h",
      modules: 10,
      progress: 0,
      completed: false,
      difficulty: "Avançado",
      color: "bg-purple-100",
      iconColor: "text-purple-600",
      locked: true
    },
    {
      id: 4,
      title: "Educação Fiscal",
      description: "Organize seus documentos e impostos",
      duration: "1h",
      modules: 5,
      progress: 30,
      completed: false,
      difficulty: "Iniciante",
      color: "bg-yellow-100",
      iconColor: "text-yellow-600"
    }
  ];

  const achievements = [
    { name: "Primeira Aula", icon: Award, unlocked: true },
    { name: "Estudante Dedicado", icon: BookOpen, unlocked: true },
    { name: "Mestre das Finanças", icon: Award, unlocked: false },
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
                Central de Educação
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Achievements Section */}
        <Card className="shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-6">
            <h3 className="text-white font-semibold text-lg mb-4">Suas Conquistas</h3>
            <div className="flex space-x-4">
              {achievements.map((achievement, idx) => (
                <div key={idx} className="text-center">
                  <div className={`w-16 h-16 rounded-full ${achievement.unlocked ? 'bg-white' : 'bg-white/30'} flex items-center justify-center mb-2`}>
                    <achievement.icon className={`h-8 w-8 ${achievement.unlocked ? 'text-orange-500' : 'text-white/50'}`} />
                  </div>
                  <p className="text-xs text-white/80">{achievement.name}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Courses Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 overflow-hidden">
              <div className={`h-2 ${course.color}`}></div>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2 flex items-center gap-2">
                      {course.title}
                      {course.completed && <CheckCircle className="h-5 w-5 text-green-500" />}
                      {course.locked && <Lock className="h-5 w-5 text-gray-400" />}
                    </CardTitle>
                    <p className="text-sm text-gray-600">{course.description}</p>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    {course.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {course.modules} módulos
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progresso</span>
                      <span className="font-medium">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </div>

                  <Button 
                    className="w-full" 
                    variant={course.locked ? "secondary" : "default"}
                    disabled={course.locked}
                  >
                    {course.locked ? (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Bloqueado
                      </>
                    ) : course.completed ? (
                      "Revisar Curso"
                    ) : course.progress > 0 ? (
                      "Continuar"
                    ) : (
                      <>
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Começar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tips Section */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Dica do Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              💡 <strong>Regra 50/30/20:</strong> Destine 50% da sua renda para necessidades, 
              30% para desejos e 20% para poupança e pagamento de dívidas. 
              Esta é uma ótima forma de começar a organizar suas finanças!
            </p>
          </CardContent>
        </Card>
      </main>

      <BottomNavigation />
    </div>
  );
}