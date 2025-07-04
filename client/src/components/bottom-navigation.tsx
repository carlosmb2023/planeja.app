import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";

export default function BottomNavigation() {
  const [location] = useLocation();
  
  const navItems = [
    { icon: "🏠", label: "Dashboard", path: "/dashboard" },
    { icon: "📊", label: "Análises", path: "/analytics" },
    { icon: "🎯", label: "Metas", path: "/goals" },
    { icon: "🛡️", label: "Seguros", path: "/insurances" },
    { icon: "🏘️", label: "Patrimônio", path: "/assets" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-blue-200/30 px-4 py-2 z-40 shadow-2xl">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item, index) => {
          const isActive = location === item.path;
          return (
            <Link key={index} href={item.path} className="flex-1">
              <div
                className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? "bg-gradient-to-t from-blue-100 to-blue-50 text-blue-600 scale-105" 
                    : "text-gray-500 hover:text-blue-600 hover:bg-blue-50/50"
                }`}
              >
                <div className={`p-2 rounded-lg transition-all duration-300 ${
                  isActive 
                    ? "bg-blue-600 text-white shadow-lg" 
                    : "bg-transparent"
                }`}>
                  <span className={`text-lg ${isActive ? 'animate-pulse' : ''}`}>{item.icon}</span>
                </div>
                <span className="text-xs font-medium mt-1">{item.label}</span>
                {isActive && (
                  <div className="w-1 h-1 bg-blue-600 rounded-full mt-1 animate-pulse"></div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
      
      {/* Planeja Brand */}
      <div className="absolute top-1 right-4 flex items-center space-x-1 opacity-60">
        <span className="text-xs">✨</span>
        <span className="text-xs font-medium text-gray-600">Planeja</span>
      </div>
    </nav>
  );
}
