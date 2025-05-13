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
import WorkExperienceDetailsPage from "@/pages/work-experience-details/page";
import JobDescriptionPage from "@/pages/job-description/page";
import WorkHistorySummaryPage from "@/pages/work-history-summary/page";
import EducationPage from "@/pages/education/page";
import EducationSummaryPage from "@/pages/education-summary/page";
import SkillsPage from "@/pages/skills/page";
import SkillsSummaryPage from "@/pages/skills-summary/page";
import ProfessionalSummaryPage from "@/pages/professional-summary/page";
import AddSectionPage from "@/pages/add-section/page";
import AuthPage from "@/pages/auth-page";
import AdminJobsTestApiPage from "@/pages/admin/jobs/test-api";
import AdminTemplatesPage from "@/pages/admin/templates/page";
import AdminTemplateEditPage from "@/pages/admin/templates/edit";
import AdvancedTemplateEditPage from "@/pages/admin/templates/advanced-edit";
import CreateNewTemplateAdminPage from "@/pages/admin/templates/new";
import TemplateVersionsPage from "@/pages/admin/templates/versions";
import AdminTemplateManagementPage from "@/pages/admin/templates/management";
import TemplateBindingsPage from "@/pages/admin/templates/bindings";
import AdminHomePage from "@/pages/admin/home";
import AdminDashboardPage from "@/pages/admin/page";
import AdminJobsPage from "@/pages/admin/jobs/page";
import AdminEducationPage from "@/pages/admin/education/page";
import AdminSkillsPage from "@/pages/admin/skills/page";
import AdminProfessionalSummaryPage from "@/pages/admin/professional-summary/page";
import AdminLink from "@/components/AdminLink";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

function Router() {
  const [location] = useLocation();
  const isWizardPage = location.startsWith("/experience-level") || 
                       location.startsWith("/templates") ||
                       location.startsWith("/upload-options") ||
                       location.startsWith("/upload-resume") ||
                       location.startsWith("/personal-information") ||
                       location.startsWith("/work-history") ||
                       location.startsWith("/work-experience-details") ||
                       location.startsWith("/job-description") ||
                       location.startsWith("/work-history-summary") ||
                       location.startsWith("/education") ||
                       location.startsWith("/education-summary") ||
                       location.startsWith("/skills") ||
                       location.startsWith("/skills-summary") ||
                       location.startsWith("/professional-summary") ||
                       location.startsWith("/add-section");
  
  const isAdminPage = location.startsWith("/admin");
  
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/experience-level" component={ExperienceLevelPage} />
      <Route path="/templates" component={TemplatesPage} />
      <Route path="/upload-options" component={UploadOptionsPage} />
      <Route path="/upload-resume" component={UploadResumePage} />
      <Route path="/personal-information" component={PersonalInformationPage} />
      <Route path="/work-history" component={WhyNeedResumePage} />
      <Route path="/work-experience-details" component={WorkExperienceDetailsPage} />
      <Route path="/job-description" component={JobDescriptionPage} />
      <Route path="/work-history-summary" component={WorkHistorySummaryPage} />
      <Route path="/education" component={EducationPage} />
      <Route path="/education-summary" component={EducationSummaryPage} />
      <Route path="/skills" component={SkillsPage} />
      <Route path="/skills-summary" component={SkillsSummaryPage} />
      <Route path="/professional-summary" component={ProfessionalSummaryPage} />
      <Route path="/add-section" component={AddSectionPage} />
      <Route path="/auth" component={AuthPage} />
      
      {/* Admin Routes - Protected + Admin Only */}
      <ProtectedRoute path="/admin/dashboard" component={AdminDashboardPage} adminOnly />
      <ProtectedRoute path="/admin/home" component={AdminHomePage} adminOnly />
      <ProtectedRoute path="/admin" component={AdminHomePage} adminOnly />
      <ProtectedRoute path="/admin/jobs" component={AdminJobsPage} adminOnly />
      <ProtectedRoute path="/admin/jobs/test-api" component={AdminJobsTestApiPage} adminOnly />
      <ProtectedRoute path="/admin/education" component={() => <AdminEducationPage />} adminOnly />
      <ProtectedRoute path="/admin/skills" component={AdminSkillsPage} adminOnly />
      <ProtectedRoute path="/admin/professional-summary" component={AdminProfessionalSummaryPage} adminOnly />
      <ProtectedRoute path="/admin/templates" component={AdminTemplatesPage} adminOnly />
      <ProtectedRoute path="/admin/templates/management" component={AdminTemplateManagementPage} adminOnly />
      <ProtectedRoute path="/admin/templates/new/basic" component={CreateNewTemplateAdminPage} adminOnly />
      <ProtectedRoute path="/admin/templates/new" component={AdvancedTemplateEditPage} adminOnly />
      <ProtectedRoute path="/admin/templates/:id/advanced" component={AdvancedTemplateEditPage} adminOnly />
      <ProtectedRoute path="/admin/templates/:id/versions" component={TemplateVersionsPage} adminOnly />
      <ProtectedRoute path="/admin/templates/:id/bindings" component={TemplateBindingsPage} adminOnly />
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
                       location.startsWith("/personal-information") || 
                       location.startsWith("/work-history") ||
                       location.startsWith("/work-experience-details") ||
                       location.startsWith("/job-description") ||
                       location.startsWith("/work-history-summary") ||
                       location.startsWith("/education") ||
                       location.startsWith("/education-summary") ||
                       location.startsWith("/skills") ||
                       location.startsWith("/skills-summary") ||
                       location.startsWith("/professional-summary") ||
                       location.startsWith("/add-section");
  
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
              {!isAdminPage && <AdminLink />}
            </div>
            <Toaster />
          </ResumeProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;