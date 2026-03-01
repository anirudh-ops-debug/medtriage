import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Bed, Users, Stethoscope, Syringe, AlertTriangle, Lightbulb, Pencil, Check } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { usePatients } from "@/contexts/PatientContext";

const ResourcesPage = () => {
  const { role } = useRole();
  const { patients } = usePatients();

  const criticalCount = patients.filter(p => p.riskLevel === "Critical").length;
  const highCount = patients.filter(p => p.riskLevel === "High").length;
  const totalPatients = patients.length;
  const erOverload = totalPatients > 0 ? Math.min(100, Math.round(((criticalCount + highCount) / Math.max(totalPatients, 1)) * 100 + 40)) : 0;

  // Generate dynamic suggestions based on real data
  const suggestions = [];
  if (criticalCount > 3) suggestions.push({ text: `${criticalCount} critical patients – consider additional ICU staffing`, urgent: true });
  if (highCount > 5) suggestions.push({ text: `${highCount} high-risk patients need close monitoring`, urgent: true });
  if (erOverload > 80) suggestions.push({ text: "Predicted ER Overload – consider patient diversion", urgent: true });
  if (totalPatients > 15) suggestions.push({ text: `${totalPatients} total patients – ensure adequate bed availability`, urgent: false });
  if (suggestions.length === 0) suggestions.push({ text: "All systems nominal – continue standard operations", urgent: false });

  const [resources, setResources] = useState({
    icuUsed: 6, icuTotal: 8,
    generalUsed: 38, generalTotal: 50,
    doctorsActive: 14, doctorsTotal: 20,
    nursesOnDuty: 24, nursesTotal: 32,
    otActive: 3, otTotal: 5,
  });

  const canEditOT = role === "doctor" || role === "admin";
  const canEditICU = role === "nurse" || role === "admin";

  return (
    <DashboardLayout>
      <div className="animate-fade-up">
        <h1 className="text-lg font-bold text-foreground mb-1">Hospital Resource Optimization</h1>
        <p className="text-xs text-muted-foreground mb-4">AI-driven resource allocation · Logged in as <span className="text-primary font-semibold capitalize">{role}</span></p>

        {(role === "doctor" || role === "nurse") && (
          <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-2">
            <Pencil size={14} className="text-primary" />
            <span className="text-[11px] text-muted-foreground">
              {role === "doctor" ? "Click the edit icon on OT cards to update details." : "Click the edit icon on ICU/Nurse cards to update."}
            </span>
          </div>
        )}

        <div className="grid grid-cols-5 gap-3 mb-6">
          <EditableResourceCard icon={Bed} label="ICU Beds" used={resources.icuUsed} total={resources.icuTotal} editable={canEditICU} onSave={(v) => setResources(p => ({...p, icuUsed: v}))} />
          <EditableResourceCard icon={Bed} label="General Beds" used={resources.generalUsed} total={resources.generalTotal} />
          <EditableResourceCard icon={Stethoscope} label="Doctors Active" used={resources.doctorsActive} total={resources.doctorsTotal} />
          <EditableResourceCard icon={Users} label="Nurses On Duty" used={resources.nursesOnDuty} total={resources.nursesTotal} editable={canEditICU} onSave={(v) => setResources(p => ({...p, nursesOnDuty: v}))} />
          <EditableResourceCard icon={Syringe} label="OT Active" used={resources.otActive} total={resources.otTotal} editable={canEditOT} onSave={(v) => setResources(p => ({...p, otActive: v}))} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className={`stat-card ${erOverload > 80 ? "glow-red-border border-primary/40" : ""}`}>
            <h2 className="text-xs font-semibold text-foreground mb-3">ER Overload Prediction</h2>
            <div className="flex items-end gap-4 mb-3">
              <p className={`text-4xl font-bold ${erOverload > 80 ? "text-primary" : "text-foreground"}`}>{erOverload}%</p>
              <p className="text-[10px] text-muted-foreground mb-1">current ER load ({criticalCount} critical, {highCount} high)</p>
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

const EditableResourceCard = ({ icon: Icon, label, used, total, editable, onSave }: { icon: any; label: string; used: number; total: number; editable?: boolean; onSave?: (val: number) => void }) => {
  const pct = (used / total) * 100;
  const isHigh = pct > 80;
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(String(used));

  useEffect(() => { setEditVal(String(used)); }, [used]);

  return (
    <div className={`stat-card ${isHigh ? "glow-red-border border-primary/40" : ""}`}>
      <div className="flex items-center justify-between">
        <Icon size={16} className={isHigh ? "text-primary" : "text-muted-foreground"} />
        {editable && !editing && (
          <button onClick={() => setEditing(true)} className="p-0.5 rounded hover:bg-primary/10 transition-colors">
            <Pencil size={11} className="text-primary" />
          </button>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">{label}</p>
      {editing ? (
        <div className="flex items-center gap-1 mt-1">
          <input
            type="number"
            value={editVal}
            onChange={(e) => setEditVal(e.target.value)}
            className="w-12 bg-secondary border border-primary/30 rounded px-1 py-0.5 text-sm font-bold text-foreground focus:outline-none"
            autoFocus
          />
          <span className="text-xs text-muted-foreground">/{total}</span>
          <button onClick={() => { onSave?.(Math.max(0, Math.min(total, Number(editVal)))); setEditing(false); }} className="p-0.5 rounded bg-primary/20 hover:bg-primary/30">
            <Check size={12} className="text-primary" />
          </button>
        </div>
      ) : (
        <p className={`text-lg font-bold ${isHigh ? "text-primary" : "text-foreground"}`}>{used}<span className="text-xs text-muted-foreground font-normal">/{total}</span></p>
      )}
      <div className="h-1 rounded-full bg-secondary mt-2">
        <div className={`h-full rounded-full ${isHigh ? "bg-primary" : "bg-medical-green"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export default ResourcesPage;
