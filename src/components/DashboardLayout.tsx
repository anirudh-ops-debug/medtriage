import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";
import LanguageToggle from "./LanguageToggle";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-60 p-6 min-h-screen">
        <div className="flex justify-end mb-3">
          <LanguageToggle />
        </div>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
