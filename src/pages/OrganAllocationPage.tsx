import DashboardLayout from "@/components/DashboardLayout";
import { Heart, Clock, TrendingUp, Shield, CheckCircle, AlertTriangle } from "lucide-react";

const organs = [
  { organ: "Kidney (Left)", donor: "Cadaveric #KD-441", bloodType: "O+", recipients: [
    { name: "Anita Verma", age: 42, wait: "18 months", urgency: 95, survival: 88, fairness: 97, rank: 1 },
    { name: "Suresh Nair", age: 56, wait: "24 months", urgency: 82, survival: 72, fairness: 91, rank: 2 },
    { name: "Fatima Begum", age: 38, wait: "12 months", urgency: 78, survival: 91, fairness: 85, rank: 3 },
  ]},
  { organ: "Liver (Partial)", donor: "Living Donor #LV-203", bloodType: "B+", recipients: [
    { name: "Vikram Singh", age: 51, wait: "9 months", urgency: 98, survival: 65, fairness: 94, rank: 1 },
    { name: "Lakshmi Rao", age: 47, wait: "14 months", urgency: 88, survival: 78, fairness: 90, rank: 2 },
  ]},
];

const OrganAllocationPage = () => (
  <DashboardLayout>
    <div className="animate-fade-up">
      <h1 className="text-lg font-bold text-foreground mb-1">Organ Allocation Module</h1>
      <p className="text-xs text-muted-foreground mb-6">Transparent AI-based ranking · Indian Transplant Guidelines Compliant</p>

      <div className="space-y-6">
        {organs.map((organ, oi) => (
          <div key={oi} className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Heart size={18} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{organ.organ}</h3>
                  <p className="text-[10px] text-muted-foreground">{organ.donor} · Blood Type: {organ.bloodType}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-medical-green/10 border border-medical-green/30">
                <CheckCircle size={10} className="text-medical-green" />
                <span className="text-[10px] text-medical-green font-medium">Regulation Aligned</span>
              </div>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Rank", "Recipient", "Wait Duration", "Urgency", "Survival Prob.", "Fairness Score", "Status"].map((h) => (
                    <th key={h} className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider text-left py-2 px-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {organ.recipients.map((r) => (
                  <tr key={r.name} className={`border-b border-border/50 ${r.rank === 1 ? "bg-primary/5" : ""}`}>
                    <td className="py-2.5 px-3"><span className={`text-sm font-bold ${r.rank === 1 ? "text-primary" : "text-foreground"}`}>#{r.rank}</span></td>
                    <td className="py-2.5 px-3">
                      <p className="text-xs font-semibold text-foreground">{r.name}</p>
                      <p className="text-[10px] text-muted-foreground">Age: {r.age}</p>
                    </td>
                    <td className="py-2.5 px-3"><span className="text-xs text-foreground flex items-center gap-1"><Clock size={10} /> {r.wait}</span></td>
                    <td className="py-2.5 px-3"><ScoreBadge value={r.urgency} /></td>
                    <td className="py-2.5 px-3"><ScoreBadge value={r.survival} /></td>
                    <td className="py-2.5 px-3"><ScoreBadge value={r.fairness} /></td>
                    <td className="py-2.5 px-3">
                      {r.rank === 1 ? (
                        <span className="text-[10px] text-primary font-bold flex items-center gap-1"><TrendingUp size={10} /> Priority</span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Waitlisted</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-3 pt-3 border-t border-border flex items-center gap-4">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Shield size={10} /> Justification Score: <strong className="text-foreground">94/100</strong></span>
              <span className="flex items-center gap-1 text-[10px] text-medical-green"><CheckCircle size={10} /> THOA Compliance Verified</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </DashboardLayout>
);

const ScoreBadge = ({ value }: { value: number }) => (
  <span className={`text-xs font-bold ${value > 85 ? "text-medical-green" : value > 65 ? "text-medical-yellow" : "text-primary"}`}>{value}%</span>
);

export default OrganAllocationPage;
