import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Activity, TrendingDown, Heart, AlertTriangle, Brain, Thermometer } from "lucide-react";

const patients = [
  { id: "PT-003", name: "Amit Patel", hrTrend: "Increasing", bpTrend: "Unstable", spo2Trend: "Declining", painEscalation: "High", collapseRisk: 87, oxygenWarning: 92, cardiacProb: 74, predicted30m: "Critical – Likely ICU" },
  { id: "PT-001", name: "Rajesh Kumar", hrTrend: "Elevated", bpTrend: "High", spo2Trend: "Borderline", painEscalation: "Moderate", collapseRisk: 62, oxygenWarning: 68, cardiacProb: 58, predicted30m: "High Risk – Monitor Closely" },
  { id: "PT-005", name: "Mohammed Iqbal", hrTrend: "Stable", bpTrend: "Elevated", spo2Trend: "Stable", painEscalation: "Low", collapseRisk: 28, oxygenWarning: 32, cardiacProb: 22, predicted30m: "Moderate – Continue Observation" },
];

const DeteriorationPage = () => {
  const [data, setData] = useState(patients);

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) =>
        prev.map((p) => ({
          ...p,
          collapseRisk: Math.min(99, Math.max(10, p.collapseRisk + Math.round((Math.random() - 0.4) * 4))),
          oxygenWarning: Math.min(99, Math.max(10, p.oxygenWarning + Math.round((Math.random() - 0.4) * 3))),
          cardiacProb: Math.min(99, Math.max(5, p.cardiacProb + Math.round((Math.random() - 0.4) * 3))),
        }))
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout>
      <div className="animate-fade-up">
        <h1 className="text-lg font-bold text-foreground mb-1">Deterioration Prediction Engine</h1>
        <p className="text-xs text-muted-foreground mb-1">Ensuring Early Intervention Before Critical Collapse</p>
        <p className="text-[10px] text-primary mb-6">AI-powered predictive analytics from live vital trends</p>

        <div className="space-y-4">
          {data.map((p) => (
            <div key={p.id} className={`stat-card ${p.collapseRisk > 70 ? "glow-red-border border-primary/40" : ""}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground">{p.name}</h3>
                  <span className="text-[10px] text-muted-foreground">{p.id}</span>
                </div>
                {p.collapseRisk > 70 && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-primary/15 border border-primary/30 critical-flash">
                    <AlertTriangle size={12} className="text-primary" />
                    <span className="text-[10px] text-primary font-bold">HIGH ALERT</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Input Trends</p>
                  <div className="space-y-2">
                    <TrendRow icon={Heart} label="HR Variability" value={p.hrTrend} />
                    <TrendRow icon={Activity} label="BP Instability" value={p.bpTrend} />
                    <TrendRow icon={TrendingDown} label="SpO₂ Trend" value={p.spo2Trend} />
                    <TrendRow icon={Thermometer} label="Pain Escalation" value={p.painEscalation} />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Predicted Risks</p>
                  <div className="space-y-3">
                    <RiskMeter label="Early Collapse Risk" value={p.collapseRisk} />
                    <RiskMeter label="Oxygen Drop Warning" value={p.oxygenWarning} />
                    <RiskMeter label="Cardiac Event Probability" value={p.cardiacProb} />
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-3 flex items-center gap-2">
                <Brain size={12} className="text-primary" />
                <span className="text-[10px] text-muted-foreground">Predicted Severity in 30 min:</span>
                <span className={`text-[11px] font-bold ${p.collapseRisk > 60 ? "text-primary" : "text-medical-yellow"}`}>{p.predicted30m}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

const TrendRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => {
  const isWarning = ["Increasing", "Unstable", "Declining", "High", "Elevated"].includes(value);
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Icon size={11} /> {label}</span>
      <span className={`text-[11px] font-semibold ${isWarning ? "text-primary" : "text-medical-green"}`}>{value}</span>
    </div>
  );
};

const RiskMeter = ({ label, value }: { label: string; value: number }) => (
  <div>
    <div className="flex justify-between mb-0.5">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className={`text-[10px] font-bold ${value > 60 ? "text-primary" : value > 35 ? "text-medical-yellow" : "text-medical-green"}`}>{value}%</span>
    </div>
    <div className="h-1.5 rounded-full bg-secondary">
      <div className={`h-full rounded-full transition-all duration-700 ${value > 60 ? "bg-primary" : value > 35 ? "bg-medical-yellow" : "bg-medical-green"}`} style={{ width: `${value}%` }} />
    </div>
  </div>
);

export default DeteriorationPage;
