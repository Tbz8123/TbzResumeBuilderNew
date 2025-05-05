import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ThemeProvider";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home/page";
import ExperienceLevelPage from "@/pages/experience-level/page";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

function Router() {
  const [location] = useLocation();
  const isWizardPage = location.startsWith("/experience-level") || 
                       location.startsWith("/templates") ||
                       location.startsWith("/builder");
  
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/experience-level" component={ExperienceLevelPage} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isWizardPage = location.startsWith("/experience-level") || 
                       location.startsWith("/templates") ||
                       location.startsWith("/builder");
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <div className="flex flex-col min-h-screen">
          {!isWizardPage && <Header />}
          <main className="flex-grow">
            <Router />
          </main>
          {!isWizardPage && <Footer />}
        </div>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
