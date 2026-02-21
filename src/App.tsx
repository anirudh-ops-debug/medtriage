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
import AccessibilityPage from "./pages/AccessibilityPage";
import ArchitecturePage from "./pages/ArchitecturePage";
import FutureScopePage from "./pages/FutureScopePage";
import RegisterPatientPage from "./pages/RegisterPatientPage";
import PatientListPage from "./pages/PatientListPage";
import PatientDetailPage from "./pages/PatientDetailPage";
import NotFound from "./pages/NotFound";
import { RoleProvider } from "./contexts/RoleContext";
import { PatientProvider } from "./contexts/PatientContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <RoleProvider>
        <PatientProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/triage" element={<TriagePage />} />
              <Route path="/queue" element={<QueuePage />} />
              <Route path="/deterioration" element={<DeteriorationPage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/organs" element={<OrganAllocationPage />} />
              <Route path="/accessibility" element={<AccessibilityPage />} />
              <Route path="/architecture" element={<ArchitecturePage />} />
              <Route path="/future" element={<FutureScopePage />} />
              <Route path="/register" element={<RegisterPatientPage />} />
              <Route path="/patients" element={<PatientListPage />} />
              <Route path="/patients/:id" element={<PatientDetailPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </PatientProvider>
      </RoleProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
