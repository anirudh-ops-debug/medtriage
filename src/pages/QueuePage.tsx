import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { AlertTriangle, Clock, TrendingUp } from "lucide-react";

interface QueuePatient {
  id: string;
  name: string;
  riskLevel: "Critical" | "High" | "Moderate" | "Stable";
  waitTime: number;
  deterioration: number;
  aiRank: number;
}

const initialQueue: QueuePatient[] = [
  { id: "PT-003", name: "Amit Patel", riskLevel: "Critical", waitTime: 5, deterioration: 89, aiRank: 1 },
  { id: "PT-001", name: "Rajesh Kumar", riskLevel: "Critical", waitTime: 12, deterioration: 72, aiRank: 2 },
  { id: "PT-005", name: "Mohammed Iqbal", riskLevel: "High", waitTime: 22, deterioration: 45, aiRank: 3 },
  { id: "PT-002", name: "Priya Sharma", riskLevel: "Moderate", waitTime: 35, deterioration: 18, aiRank: 4 },
  { id: "PT-004", name: "Sunita Devi", riskLevel: "Stable", waitTime: 48, deterioration: 5, aiRank: 5 },
];

const riskColors: Record<string, string> = {
  Critical: "text-primary",
  High: "text-medical-yellow",
  Moderate: "text-medical-blue",
  Stable: "text-medical-green",
};

const QueuePage = () => {
  const [queue, setQueue] = useState(initialQueue);

  useEffect(() => {
    const interval = setInterval(() => {
      setQueue((prev) => {
        const updated = prev.map((p) => ({
          ...p,
          waitTime: p.waitTime + 1,
          deterioration: Math.min(99, Math.max(0, p.deterioration + Math.round((Math.random() - 0.4) * 5))),
        }));
        return updated.sort((a, b) => b.deterioration - a.deterioration).map((p, i) => ({ ...p, aiRank: i + 1 }));
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout>
      <div className="animate-fade-up">
        <h1 className="text-lg font-bold text-foreground mb-1">Auto Queue Priority System</h1>
        <p className="text-xs text-muted-foreground mb-6">AI-managed live prioritization based on vitals & deterioration risk</p>

        <div className="stat-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Rank", "Patient", "Risk Level", "Wait Time", "Deterioration %", "AI Priority"].map((h) => (
                  <th key={h} className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider text-left py-3 px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queue.map((p, i) => (
                <tr key={p.id} className={`border-b border-border/50 transition-all duration-500 ${p.riskLevel === "Critical" ? "bg-primary/5 critical-flash" : "hover:bg-secondary/50"}`}
                  style={{ animationDelay: `${i * 100}ms` }}>
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
                    <span className="text-xs text-foreground flex items-center gap-1"><Clock size={10} /> {p.waitTime}m</span>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default QueuePage;
