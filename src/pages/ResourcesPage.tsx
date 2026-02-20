import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Bed, Users, Stethoscope, Syringe, AlertTriangle, Lightbulb } from "lucide-react";

const suggestions = [
  { text: "Reallocate Cardiologist to ER – cardiac cases rising", urgent: true },
  { text: "Open 2 Emergency Beds in Ward B", urgent: true },
  { text: "Shift Nurse Priya to ICU – understaffed", urgent: false },
  { text: "Predicted ER Overload in 30 Minutes", urgent: true },
  { text: "Schedule OT-3 for emergency surgery", urgent: false },
];

const ResourcesPage = () => {
  const [erOverload, setErOverload] = useState(76);

  useEffect(() => {
    const interval = setInterval(() => {
      setErOverload((prev) => Math.min(100, Math.max(55, prev + Math.round((Math.random() - 0.45) * 3))));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout>
      <div className="animate-fade-up">
        <h1 className="text-lg font-bold text-foreground mb-1">Hospital Resource Optimization</h1>
        <p className="text-xs text-muted-foreground mb-6">AI-driven resource allocation & overload prediction</p>

        <div className="grid grid-cols-5 gap-3 mb-6">
          <ResourceCard icon={Bed} label="ICU Beds" used={6} total={8} />
          <ResourceCard icon={Bed} label="General Beds" used={38} total={50} />
          <ResourceCard icon={Stethoscope} label="Doctors Active" used={14} total={20} />
          <ResourceCard icon={Users} label="Nurses On Duty" used={24} total={32} />
          <ResourceCard icon={Syringe} label="OT Active" used={3} total={5} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* ER Overload */}
          <div className={`stat-card ${erOverload > 80 ? "glow-red-border border-primary/40" : ""}`}>
            <h2 className="text-xs font-semibold text-foreground mb-3">ER Overload Prediction</h2>
            <div className="flex items-end gap-4 mb-3">
              <p className={`text-4xl font-bold ${erOverload > 80 ? "text-primary" : "text-foreground"}`}>{erOverload}%</p>
              <p className="text-[10px] text-muted-foreground mb-1">current ER load</p>
            </div>
            <div className="h-2 rounded-full bg-secondary mb-3">
              <div className={`h-full rounded-full transition-all duration-700 ${erOverload > 80 ? "bg-primary" : erOverload > 60 ? "bg-medical-yellow" : "bg-medical-green"}`} style={{ width: `${erOverload}%` }} />
            </div>
            {erOverload > 75 && (
              <p className="text-[10px] text-primary font-semibold flex items-center gap-1">
                <AlertTriangle size={10} /> Overload warning – consider patient diversion
              </p>
            )}
          </div>

          {/* AI Suggestions */}
          <div className="stat-card">
            <h2 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
              <Lightbulb size={14} className="text-medical-yellow" /> AI Suggestions
            </h2>
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <div key={i} className={`flex items-start gap-2 p-2 rounded-lg border ${s.urgent ? "border-primary/20 bg-primary/5" : "border-border bg-secondary"}`}>
                  {s.urgent ? <AlertTriangle size={12} className="text-primary mt-0.5 shrink-0" /> : <div className="w-3 h-3 rounded-full bg-medical-green/20 border border-medical-green/40 mt-0.5 shrink-0" />}
                  <span className="text-[11px] text-foreground">{s.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

const ResourceCard = ({ icon: Icon, label, used, total }: { icon: any; label: string; used: number; total: number }) => {
  const pct = (used / total) * 100;
  const isHigh = pct > 80;
  return (
    <div className={`stat-card ${isHigh ? "glow-red-border border-primary/40" : ""}`}>
      <Icon size={16} className={isHigh ? "text-primary" : "text-muted-foreground"} />
      <p className="text-[10px] text-muted-foreground mt-2">{label}</p>
      <p className={`text-lg font-bold ${isHigh ? "text-primary" : "text-foreground"}`}>{used}<span className="text-xs text-muted-foreground font-normal">/{total}</span></p>
      <div className="h-1 rounded-full bg-secondary mt-2">
        <div className={`h-full rounded-full ${isHigh ? "bg-primary" : "bg-medical-green"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export default ResourcesPage;
