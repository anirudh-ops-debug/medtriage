import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { usePatients } from "@/contexts/PatientContext";

const riskColors: Record<string, string> = {
  Critical: "text-primary",
  High: "text-medical-yellow",
  Moderate: "text-medical-blue",
  Stable: "text-medical-green",
};

const QueuePage = () => {
  const { patients, loading } = usePatients();

  // Build queue from real patients, sorted by risk severity
  const riskOrder: Record<string, number> = { Critical: 0, High: 1, Moderate: 2, Stable: 3 };

  const queue = patients
    .map((p) => ({
      id: p.id,
      name: p.name,
      riskLevel: p.riskLevel,
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
          <p className="text-sm text-muted-foreground">Loading queue...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="animate-fade-up">
        <h1 className="text-lg font-bold text-foreground mb-1">Auto Queue Priority System</h1>
        <p className="text-xs text-muted-foreground mb-6">AI-managed live prioritization based on vitals & deterioration risk</p>

        <div className="stat-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Rank", "Patient", "Risk Level", "Deterioration %", "AI Priority"].map((h) => (
                  <th key={h} className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider text-left py-3 px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queue.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-xs text-muted-foreground">No patients in queue</td></tr>
              ) : (
                queue.map((p, i) => (
                  <tr key={p.id} className={`border-b border-border/50 transition-all duration-500 ${p.riskLevel === "Critical" ? "bg-primary/5 critical-flash" : "hover:bg-secondary/50"}`}>
                    <td className="py-3 px-4">
                      <span className={`text-sm font-bold ${p.aiRank === 1 ? "text-primary" : "text-foreground"}`}>#{p.aiRank}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-xs font-semibold text-foreground">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">{p.id}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-bold ${riskColors[p.riskLevel]}`}>{p.riskLevel}</span>
                    </td>
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
                        <span className="flex items-center gap-1 text-[10px] text-primary font-bold"><AlertTriangle size={10} /> URGENT</span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><TrendingUp size={10} /> Monitored</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default QueuePage;
