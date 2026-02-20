import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Activity, Users, Building2, Heart, Cpu,
  Rocket, Settings, LogOut, Cross, Accessibility
} from "lucide-react";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/triage", label: "AI Triage", icon: Activity },
  { path: "/queue", label: "Priority Queue", icon: Users },
  { path: "/deterioration", label: "Deterioration", icon: Cpu },
  { path: "/resources", label: "Resources", icon: Building2 },
  { path: "/organs", label: "Organ Allocation", icon: Heart },
  { path: "/accessibility", label: "Accessibility", icon: Accessibility },
  { path: "/architecture", label: "Architecture", icon: Settings },
  { path: "/future", label: "Future Scope", icon: Rocket },
];

const AppSidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-60 h-screen bg-sidebar border-r border-sidebar-border flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center glow-red">
          <Cross className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-xs font-bold text-foreground leading-tight">MedTriage AI</p>
          <p className="text-[10px] text-muted-foreground">v2.1 · Admin</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {navItems.map((item) => {
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
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <NavLink to="/" className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-sidebar-accent">
          <LogOut size={14} />
          Logout
        </NavLink>
      </div>
    </aside>
  );
};

export default AppSidebar;
