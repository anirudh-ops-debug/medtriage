import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Activity, Users, Building2, Heart, Cpu,
  Settings, LogOut, Cross, UserPlus, List, Bot, Database
} from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";

const navKeys = [
  { path: "/dashboard", key: "nav.dashboard", icon: LayoutDashboard },
  { path: "/register", key: "nav.registerPatient", icon: UserPlus },
  { path: "/patients", key: "nav.patientList", icon: List },
  { path: "/triage", key: "nav.aiTriage", icon: Activity },
  { path: "/queue", key: "nav.priorityQueue", icon: Users },
  { path: "/deterioration", key: "nav.deterioration", icon: Cpu },
  { path: "/resources", key: "nav.resources", icon: Building2 },
  { path: "/organs", key: "nav.organAllocation", icon: Heart },
  { path: "/medibot", key: "nav.medibot", icon: Bot },
  { path: "/architecture", key: "nav.architecture", icon: Settings },
  { path: "/seed", key: "nav.seedData", icon: Database },
];

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role } = useRole();
  const { signOut } = useAuth();
  const { t } = useLanguage();

  return (
    <aside className="w-60 h-screen bg-sidebar border-r border-sidebar-border flex flex-col fixed left-0 top-0 z-40">
      <div className="p-4 border-b border-sidebar-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center glow-red">
          <Cross className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-xs font-bold text-foreground leading-tight">{t("app.name")}</p>
          <p className="text-[10px] text-muted-foreground">v2.1 · <span className="capitalize">{role}</span></p>
        </div>
      </div>

      <nav className="flex-1 py-2 overflow-y-auto">
        {navKeys.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border border-transparent"
              }`}
            >
              <item.icon size={16} />
              {t(item.key)}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={async () => { await signOut(); navigate("/"); }}
          className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-sidebar-accent w-full"
        >
          <LogOut size={14} />
          {t("nav.logout")}
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
