import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
