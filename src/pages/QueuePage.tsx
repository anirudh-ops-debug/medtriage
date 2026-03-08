import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { AlertTriangle, Clock, TrendingUp, LogOut } from "lucide-react";
import { usePatients } from "@/contexts/PatientContext";
import { useLanguage } from "@/i18n/LanguageContext";

const riskColors: Record<string, string> = {
  Critical: "text-primary",
  High: "text-medical-yellow",
  Moderate: "text-medical-blue",
  Stable: "text-medical-green",
};

const QueuePage = () => {
  const { patients, loading } = usePatients();
  const { t } = useLanguage();
  const [showDischarged, setShowDischarged] = useState(false);

  const riskOrder: Record<string, number> = { Critical: 0, High: 1, Moderate: 2, Stable: 3 };

  const activePatients = patients.filter(p => !p.diagnosis?.includes("DISCHARGED"));
  const dischargedPatients = patients.filter(p => p.diagnosis?.includes("DISCHARGED"));

  const queue = activePatients
    .map((p) => ({
      id: p.id, name: p.name, riskLevel: p.riskLevel,
      deterioration: Math.max(p.oxygenDropRisk, p.cardiacRisk),
    }))
    .sort((a, b) => {
      const riskDiff = (riskOrder[a.riskLevel] ?? 3) - (riskOrder[b.riskLevel] ?? 3);
      if (riskDiff !== 0) return riskDiff;
      return b.deterioration - a.deterioration;
    })
    .map((p, i) => ({ ...p, aiRank: i + 1 }));

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-sm text-muted-foreground">{t("queue.loadingQueue")}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="animate-fade-up">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-lg font-bold text-foreground">{t("queue.title")}</h1>
          {dischargedPatients.length > 0 && (
            <button onClick={() => setShowDischarged(!showDischarged)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs text-foreground hover:border-primary/30 transition-all">
              <LogOut size={12} /> {showDischarged ? "Hide" : "Show"} Discharged ({dischargedPatients.length})
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-6">{t("queue.subtitle")}</p>

        <div className="stat-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {[t("queue.rank"), t("queue.patient"), t("queue.riskLevel"), t("queue.deteriorationPct"), t("queue.aiPriority")].map((h) => (
                  <th key={h} className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider text-left py-3 px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queue.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-xs text-muted-foreground">{t("queue.noPatients")}</td></tr>
              ) : (
                queue.map((p) => (
                  <tr key={p.id} className={`border-b border-border/50 transition-all duration-500 ${p.riskLevel === "Critical" ? "bg-primary/5 critical-flash" : "hover:bg-secondary/50"}`}>
                    <td className="py-3 px-4"><span className={`text-sm font-bold ${p.aiRank === 1 ? "text-primary" : "text-foreground"}`}>#{p.aiRank}</span></td>
                    <td className="py-3 px-4"><p className="text-xs font-semibold text-foreground">{p.name}</p><p className="text-[10px] text-muted-foreground">{p.id}</p></td>
                    <td className="py-3 px-4"><span className={`text-xs font-bold ${riskColors[p.riskLevel]}`}>{p.riskLevel}</span></td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-secondary">
                          <div className={`h-full rounded-full transition-all duration-1000 ${p.deterioration > 60 ? "bg-primary" : p.deterioration > 30 ? "bg-medical-yellow" : "bg-medical-green"}`} style={{ width: `${p.deterioration}%` }} />
                        </div>
                        <span className={`text-[10px] font-bold ${p.deterioration > 60 ? "text-primary" : "text-muted-foreground"}`}>{p.deterioration}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {p.deterioration > 70 ? (
                        <span className="flex items-center gap-1 text-[10px] text-primary font-bold"><AlertTriangle size={10} /> {t("queue.urgent")}</span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><TrendingUp size={10} /> {t("queue.monitored")}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Discharged Panel */}
        {showDischarged && dischargedPatients.length > 0 && (
          <div className="stat-card mt-4">
            <h2 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2"><LogOut size={14} className="text-muted-foreground" /> Discharged Patients</h2>
            <div className="space-y-1">
              {dischargedPatients.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg border border-border bg-muted/30">
                  <div>
                    <p className="text-xs font-semibold text-foreground">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">{p.id} · Admitted {p.admissionDate}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-muted text-muted-foreground border-border">Discharged</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default QueuePage;
