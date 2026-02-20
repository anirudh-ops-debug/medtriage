import DashboardLayout from "@/components/DashboardLayout";
import { Globe, Ambulance, Thermometer, Database, BarChart3 } from "lucide-react";

const items = [
  { icon: Globe, title: "Government Health Record Integration", desc: "Connect to Ayushman Bharat & National Health Stack for unified patient records across India." },
  { icon: Ambulance, title: "AI Ambulance Routing", desc: "Real-time traffic-aware routing to direct ambulances to the nearest available hospital." },
  { icon: Thermometer, title: "Sepsis Early Warning", desc: "ML-powered early detection of sepsis markers from vital sign patterns." },
  { icon: Database, title: "National Organ Registry Integration", desc: "Direct integration with NOTTO for seamless organ allocation workflows." },
  { icon: BarChart3, title: "Nationwide Predictive Analytics", desc: "Aggregate hospital data for pandemic preparedness and resource forecasting." },
];

const FutureScopePage = () => (
  <DashboardLayout>
    <div className="animate-fade-up">
      <h1 className="text-lg font-bold text-foreground mb-1">Future Scope</h1>
      <p className="text-xs text-muted-foreground mb-6">Planned expansions for the AI hospital ecosystem</p>

      <div className="grid grid-cols-3 gap-4">
        {items.map((item, i) => (
          <div key={i} className="stat-card group hover:glow-red-border hover:border-primary/30 transition-all duration-300">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
              <item.icon size={20} className="text-primary" />
            </div>
            <h3 className="text-sm font-bold text-foreground mb-1">{item.title}</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </DashboardLayout>
);

export default FutureScopePage;
