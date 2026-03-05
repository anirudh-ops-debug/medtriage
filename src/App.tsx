import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import TriagePage from "./pages/TriagePage";
import QueuePage from "./pages/QueuePage";
import DeteriorationPage from "./pages/DeteriorationPage";
import ResourcesPage from "./pages/ResourcesPage";
import OrganAllocationPage from "./pages/OrganAllocationPage";

import ArchitecturePage from "./pages/ArchitecturePage";
import FutureScopePage from "./pages/FutureScopePage";
import RegisterPatientPage from "./pages/RegisterPatientPage";
import PatientListPage from "./pages/PatientListPage";
import PatientDetailPage from "./pages/PatientDetailPage";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";
import { RoleProvider } from "./contexts/RoleContext";
import { PatientProvider } from "./contexts/PatientContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { LanguageProvider } from "./i18n/LanguageContext";

const queryClient = new QueryClient();

const P = ({ children }: { children: React.ReactNode }) => <ProtectedRoute>{children}</ProtectedRoute>;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthProvider>
          <RoleProvider>
            <PatientProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<LoginPage />} />
                  <Route path="/dashboard" element={<P><DashboardPage /></P>} />
                  <Route path="/triage" element={<P><TriagePage /></P>} />
                  <Route path="/queue" element={<P><QueuePage /></P>} />
                  <Route path="/deterioration" element={<P><DeteriorationPage /></P>} />
                  <Route path="/resources" element={<P><ResourcesPage /></P>} />
                  <Route path="/organs" element={<P><OrganAllocationPage /></P>} />
                  
                  <Route path="/architecture" element={<P><ArchitecturePage /></P>} />
                  <Route path="/future" element={<P><FutureScopePage /></P>} />
                  <Route path="/register" element={<P><RegisterPatientPage /></P>} />
                  <Route path="/patients" element={<P><PatientListPage /></P>} />
                  <Route path="/patients/:id" element={<P><PatientDetailPage /></P>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </PatientProvider>
          </RoleProvider>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
