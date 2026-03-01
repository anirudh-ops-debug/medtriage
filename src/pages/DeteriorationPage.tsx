import DashboardLayout from "@/components/DashboardLayout";
import { Activity, TrendingDown, Heart, AlertTriangle, Brain, Thermometer } from "lucide-react";
import { usePatients } from "@/contexts/PatientContext";

const DeteriorationPage = () => {
  const { patients, loading } = usePatients();

  // Only show patients with non-stable risk
  const atRiskPatients = patients
    .filter((p) => p.riskLevel === "Critical" || p.riskLevel === "High" || p.riskLevel === "Moderate")
    .map((p) => {
      const hrTrend = p.vitals.hr > 110 ? "Increasing" : p.vitals.hr > 90 ? "Elevated" : "Stable";
      const bpTrend = p.vitals.bpSys > 160 ? "Unstable" : p.vitals.bpSys > 140 ? "High" : p.vitals.bpSys < 90 ? "Low" : "Stable";
      const spo2Trend = p.vitals.spo2 < 90 ? "Declining" : p.vitals.spo2 < 94 ? "Borderline" : "Stable";
      const painEscalation = p.riskLevel === "Critical" ? "High" : p.riskLevel === "High" ? "Moderate" : "Low";

      const predicted30m =
        p.riskLevel === "Critical" ? "Critical – Likely ICU" :
        p.riskLevel === "High" ? "High Risk – Monitor Closely" :
        "Moderate – Continue Observation";

      return {
        id: p.id,
        name: p.name,
        hrTrend,
        bpTrend,
        spo2Trend,
        painEscalation,
        collapseRisk: p.oxygenDropRisk,
        oxygenWarning: Math.max(0, Math.min(99, (100 - p.vitals.spo2) * 5)),
        cardiacProb: p.cardiacRisk,
        predicted30m,
      };
    })
    .sort((a, b) => b.collapseRisk - a.collapseRisk);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="animate-fade-up">
        <h1 className="text-lg font-bold text-foreground mb-1">Deterioration Prediction Engine</h1>
        <p className="text-xs text-muted-foreground mb-1">Ensuring Early Intervention Before Critical Collapse</p>
        <p className="text-[10px] text-primary mb-6">AI-powered predictive analytics from live vital trends</p>

        {atRiskPatients.length === 0 ? (
          <div className="stat-card flex items-center justify-center h-32">
            <p className="text-xs text-muted-foreground">No at-risk patients currently</p>
          </div>
        ) : (
          <div className="space-y-4">
            {atRiskPatients.map((p) => (
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
        )}
      </div>
    </DashboardLayout>
  );
};

const TrendRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => {
  const isWarning = ["Increasing", "Unstable", "Declining", "High", "Elevated", "Low"].includes(value);
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
