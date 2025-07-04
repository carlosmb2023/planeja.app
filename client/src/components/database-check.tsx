import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export function DatabaseCheck({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const [hasSeenPrivacy, setHasSeenPrivacy] = useState(false);

  useEffect(() => {
    // Verifica se o usuário já viu a página de privacidade
    const seenPrivacy = localStorage.getItem("privacy_accepted");
    
    if (seenPrivacy === "true") {
      setHasSeenPrivacy(true);
    } else {
      // Se não viu a página de privacidade, redireciona
      const publicPaths = ["/login", "/register", "/privacy-setup", "/database-setup"];
      const currentPath = window.location.pathname;
      
      if (!publicPaths.includes(currentPath) && currentPath !== "/") {
        setLocation("/privacy-setup");
      }
    }
  }, [setLocation]);

  return <>{children}</>;
}