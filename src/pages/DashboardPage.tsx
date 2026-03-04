import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Activity, Bed, Users, Stethoscope, HeartPulse, Syringe, AlertTriangle, Pencil, Check } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { usePatients } from "@/contexts/PatientContext";
import { useLanguage } from "@/i18n/LanguageContext";

const StatCard = ({ label, value, sub, icon: Icon, alert, editable, onSave }: { label: string; value: string | number; sub?: string; icon: any; alert?: boolean; editable?: boolean; onSave?: (val: number) => void }) => {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(String(value));

  useEffect(() => { setEditVal(String(value)); }, [value]);

  return (
    <div className={`stat-card ${alert ? "glow-red-border border-primary/40" : ""}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</span>
        <div className="flex items-center gap-1">
          {editable && !editing && (
            <button onClick={() => setEditing(true)} className="p-0.5 rounded hover:bg-primary/10 transition-colors">
              <Pencil size={12} className="text-primary" />
            </button>
          )}
          <Icon size={16} className={alert ? "text-primary" : "text-muted-foreground"} />
        </div>
      </div>
      {editing ? (
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={editVal}
            onChange={(e) => setEditVal(e.target.value)}
            className="w-16 bg-secondary border border-primary/30 rounded px-2 py-1 text-lg font-bold text-foreground focus:outline-none focus:border-primary"
            autoFocus
          />
          <button
            onClick={() => { onSave?.(Number(editVal)); setEditing(false); }}
            className="p-1 rounded bg-primary/20 hover:bg-primary/30 transition-colors"
          >
            <Check size={14} className="text-primary" />
          </button>
        </div>
      ) : (
        <p className={`text-2xl font-bold ${alert ? "text-primary" : "text-foreground"}`}>{value}</p>
      )}
      {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
};

const CircularMeter = ({ value, max, label, color }: { value: number; max: number; label: string; color: string }) => {
  const pct = (value / max) * 100;
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  const isHigh = pct > 80;

  return (
    <div className="flex flex-col items-center">
      <svg width="90" height="90" className="-rotate-90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="hsl(0 0% 14%)" strokeWidth="6" />
        <circle
          cx="45" cy="45" r={r} fill="none"
          stroke={isHigh ? "hsl(352 82% 38%)" : color}
          strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
      </svg>
      <p className="text-lg font-bold text-foreground -mt-14">{pct.toFixed(0)}%</p>
      <p className="text-[10px] text-muted-foreground mt-8">{label}</p>
    </div>
  );
};

const DashboardPage = () => {
  const { role } = useRole();
  const { patients, loading } = usePatients();
  const { t } = useLanguage();

  const criticalPatients = patients.filter(p => p.riskLevel === "Critical").length;
  const highPatients = patients.filter(p => p.riskLevel === "High").length;
  const totalPatients = patients.length;

  const [resources, setResources] = useState({
    icuBeds: 4,
    generalBeds: 22,
    doctors: 12,
    nurses: 28,
    otStatus: 3,
  });

  const erLoad = totalPatients > 0 ? Math.min(100, Math.round(((criticalPatients + highPatients) / Math.max(totalPatients, 1)) * 100 + 40)) : 0;

  const canEditOT = role === "doctor" || role === "admin";
  const canEditICU = role === "nurse" || role === "admin";

  return (
    <DashboardLayout>
      <div className="animate-fade-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-bold text-foreground">{t("dashboard.commandCenter")}</h1>
            <p className="text-xs text-muted-foreground">{t("dashboard.realtimeOverview")} · {t("dashboard.loggedInAs")} <span className="text-primary font-semibold capitalize">{role}</span> · {totalPatients} {t("dashboard.patients")}</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <div className="status-dot status-dot-connected" />
            <span className="text-[10px] text-primary font-medium">{t("app.allSystemsOnline")}</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard label={t("dashboard.erLoad")} value={`${erLoad}%`} sub={`${totalPatients} ${t("dashboard.patientsTotal")}`} icon={Activity} alert={erLoad > 75} />
          <StatCard
            label={t("dashboard.icuBedsFree")}
            value={resources.icuBeds}
            sub={`of 8 total`}
            icon={Bed}
            alert={resources.icuBeds < 3}
            editable={canEditICU}
            onSave={(val) => setResources((p) => ({ ...p, icuBeds: Math.max(0, Math.min(8, val)) }))}
          />
          <StatCard label={t("dashboard.generalBeds")} value={resources.generalBeds} sub="of 50 total" icon={Bed} />
          <StatCard label={t("dashboard.criticalPatients")} value={criticalPatients} icon={AlertTriangle} alert={criticalPatients > 0} />
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard label={t("dashboard.doctorsAvailable")} value={resources.doctors} sub={`4 ${t("dashboard.inSurgery")}`} icon={Stethoscope} />
          <StatCard
            label={t("dashboard.nursesOnDuty")}
            value={resources.nurses}
            sub={t("dashboard.shiftActive")}
            icon={Users}
            editable={canEditICU}
            onSave={(val) => setResources((p) => ({ ...p, nurses: Math.max(0, val) }))}
          />
          <StatCard
            label={t("dashboard.otActive")}
            value={`${resources.otStatus}/5`}
            sub={`2 ${t("dashboard.scheduled")}`}
            icon={Syringe}
            editable={canEditOT}
            onSave={(val) => setResources((p) => ({ ...p, otStatus: Math.max(0, Math.min(5, val)) }))}
          />
          <StatCard label={t("dashboard.highRisk")} value={highPatients} sub={t("dashboard.needMonitoring")} icon={HeartPulse} alert={highPatients > 3} />
        </div>

        {(role === "doctor" || role === "nurse") && (
          <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-2">
            <Pencil size={14} className="text-primary" />
            <span className="text-[11px] text-muted-foreground">
              {role === "doctor" ? t("dashboard.editOTNote") : t("dashboard.editICUNote")}
            </span>
          </div>
        )}

        <div className="stat-card">
          <h2 className="text-xs font-semibold text-foreground mb-4">{t("dashboard.resourceUtilization")}</h2>
          <div className="flex justify-around">
            <CircularMeter value={erLoad} max={100} label={t("dashboard.erLoadLabel")} color="hsl(210 80% 50%)" />
            <CircularMeter value={8 - resources.icuBeds} max={8} label={t("dashboard.icuOccupancy")} color="hsl(352 82% 38%)" />
            <CircularMeter value={28} max={50} label={t("dashboard.generalBedsLabel")} color="hsl(45 90% 50%)" />
            <CircularMeter value={resources.otStatus} max={5} label={t("dashboard.otUsage")} color="hsl(142 70% 40%)" />
            <CircularMeter value={resources.doctors} max={20} label={t("dashboard.doctorLoad")} color="hsl(210 80% 50%)" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
