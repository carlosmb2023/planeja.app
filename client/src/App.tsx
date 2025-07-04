import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { authManager } from "@/lib/auth";
import { useState, useEffect } from "react";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Analytics from "@/pages/analytics";
import Goals from "@/pages/goals";
import Documents from "@/pages/documents";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import Education from "@/pages/education";
import Assets from "@/pages/assets";
import Insurances from "@/pages/insurances";
import Reports from "@/pages/reports";
import RetirementSimulator from "@/pages/retirement-simulator";
import DatabaseSetup from "@/pages/database-setup";
import PrivacySetup from "@/pages/privacy-setup";
import NotFound from "@/pages/not-found";
import { DatabaseCheck } from "@/components/database-check";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/goals" component={Goals} />
      <Route path="/documents" component={Documents} />
      <Route path="/profile" component={Profile} />
      <Route path="/settings" component={Settings} />
      <Route path="/education" component={Education} />
      <Route path="/assets" component={Assets} />
      <Route path="/insurances" component={Insurances} />
      <Route path="/reports" component={Reports} />
      <Route path="/retirement-simulator" component={RetirementSimulator} />
      <Route path="/database-setup" component={DatabaseSetup} />
      <Route path="/privacy-setup" component={PrivacySetup} />
      <Route path="/login" component={(props) => <Login onLogin={() => window.location.reload()} />} />
      <Route path="/register" component={(props) => <Register onRegister={() => window.location.reload()} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <DatabaseCheck>
          <Router />
        </DatabaseCheck>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(authManager.isAuthenticated());

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(authManager.isAuthenticated());
    };

    // Check auth status periodically
    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Login onLogin={() => setIsAuthenticated(true)} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return <AuthenticatedApp />;
}

export default App;
