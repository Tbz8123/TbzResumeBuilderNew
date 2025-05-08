import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/hooks/use-auth";
import { ResumeProvider } from "@/contexts/ResumeContext";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home/page";
import ExperienceLevelPage from "@/pages/experience-level/page";
import TemplatesPage from "@/pages/templates/page";
import PersonalInformationPage from "@/pages/personal-information/page";
import UploadOptionsPage from "@/pages/upload-options/page";
import UploadResumePage from "@/pages/upload-resume/page";
import WhyNeedResumePage from "@/pages/work-history/page";
import AuthPage from "@/pages/auth-page";
import AdminTemplatesPage from "@/pages/admin/templates/page";
import AdminTemplateEditPage from "@/pages/admin/templates/edit";
import AdvancedTemplateEditPage from "@/pages/admin/templates/advanced-edit";
import CreateNewTemplateAdminPage from "@/pages/admin/templates/new";
import TemplateVersionsPage from "@/pages/admin/templates/versions";
import AdminTemplateManagementPage from "@/pages/admin/templates/management";
import AdminHomePage from "@/pages/admin/home";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

function Router() {
  const [location] = useLocation();
  const isWizardPage = location.startsWith("/experience-level") || 
                       location.startsWith("/templates") ||
                       location.startsWith("/upload-options") ||
                       location.startsWith("/upload-resume") ||
                       location.startsWith("/personal-information");
  
  const isAdminPage = location.startsWith("/admin");
  
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/experience-level" component={ExperienceLevelPage} />
      <Route path="/templates" component={TemplatesPage} />
      <Route path="/upload-options" component={UploadOptionsPage} />
      <Route path="/upload-resume" component={UploadResumePage} />
      <Route path="/personal-information" component={PersonalInformationPage} />
      <Route path="/auth" component={AuthPage} />
      
      {/* Admin Routes - Protected + Admin Only */}
      <ProtectedRoute path="/admin/home" component={AdminHomePage} adminOnly />
      <ProtectedRoute path="/admin" component={AdminHomePage} adminOnly />
      <ProtectedRoute path="/admin/templates" component={AdminTemplatesPage} adminOnly />
      <ProtectedRoute path="/admin/templates/management" component={AdminTemplateManagementPage} adminOnly />
      <ProtectedRoute path="/admin/templates/new/basic" component={CreateNewTemplateAdminPage} adminOnly />
      <ProtectedRoute path="/admin/templates/new" component={AdvancedTemplateEditPage} adminOnly />
      <ProtectedRoute path="/admin/templates/:id/advanced" component={AdvancedTemplateEditPage} adminOnly />
      <ProtectedRoute path="/admin/templates/:id/versions" component={TemplateVersionsPage} adminOnly />
      <ProtectedRoute path="/admin/templates/:id" component={AdminTemplateEditPage} adminOnly />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isWizardPage = location.startsWith("/experience-level") || 
                       location.startsWith("/templates") ||
                       location.startsWith("/upload-options") ||
                       location.startsWith("/upload-resume") ||
                       location.startsWith("/personal-information");
  
  const isAdminPage = location.startsWith("/admin");
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <ResumeProvider>
            <div className="flex flex-col min-h-screen">
              {!isWizardPage && !isAdminPage && location !== "/auth" && <Header />}
              <main className={`flex-grow ${isAdminPage ? 'bg-gray-50' : ''}`}>
                <Router />
              </main>
              {!isWizardPage && !isAdminPage && location !== "/auth" && <Footer />}
            </div>
            <Toaster />
          </ResumeProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;