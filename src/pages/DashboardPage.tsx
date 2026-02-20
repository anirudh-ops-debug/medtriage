import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Activity, Bed, Users, Stethoscope, HeartPulse, Syringe, AlertTriangle, Pencil, Check } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";

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
  const [stats, setStats] = useState({
    erLoad: 78,
    icuBeds: 4,
    generalBeds: 22,
    doctors: 12,
    nurses: 28,
    otStatus: 3,
    criticalPatients: 5,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        erLoad: Math.min(100, Math.max(50, prev.erLoad + (Math.random() > 0.5 ? 1 : -1))),
        criticalPatients: Math.max(2, Math.min(10, prev.criticalPatients + (Math.random() > 0.6 ? 1 : -1))),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const canEditOT = role === "doctor" || role === "admin";
  const canEditICU = role === "nurse" || role === "admin";

  return (
    <DashboardLayout>
      <div className="animate-fade-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-bold text-foreground">Command Center</h1>
            <p className="text-xs text-muted-foreground">Real-time hospital overview · Logged in as <span className="text-primary font-semibold capitalize">{role}</span></p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <div className="status-dot status-dot-connected" />
            <span className="text-[10px] text-primary font-medium">All Systems Online</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard label="ER Load" value={`${stats.erLoad}%`} sub="12 patients waiting" icon={Activity} alert={stats.erLoad > 75} />
          <StatCard
            label="ICU Beds Free"
            value={stats.icuBeds}
            sub="of 8 total"
            icon={Bed}
            alert={stats.icuBeds < 3}
            editable={canEditICU}
            onSave={(val) => setStats((p) => ({ ...p, icuBeds: Math.max(0, Math.min(8, val)) }))}
          />
          <StatCard label="General Beds" value={stats.generalBeds} sub="of 50 total" icon={Bed} />
          <StatCard label="Critical Patients" value={stats.criticalPatients} icon={AlertTriangle} alert />
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard label="Doctors Available" value={stats.doctors} sub="4 in surgery" icon={Stethoscope} />
          <StatCard
            label="Nurses On Duty"
            value={stats.nurses}
            sub="Shift B active"
            icon={Users}
            editable={canEditICU}
            onSave={(val) => setStats((p) => ({ ...p, nurses: Math.max(0, val) }))}
          />
          <StatCard
            label="OT Active"
            value={`${stats.otStatus}/5`}
            sub="2 scheduled"
            icon={Syringe}
            editable={canEditOT}
            onSave={(val) => setStats((p) => ({ ...p, otStatus: Math.max(0, Math.min(5, val)) }))}
          />
          <StatCard label="Avg Wait Time" value="23m" sub="Target: <15m" icon={HeartPulse} alert />
        </div>

        {/* Role Info Banner */}
        {(role === "doctor" || role === "nurse") && (
          <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-2">
            <Pencil size={14} className="text-primary" />
            <span className="text-[11px] text-muted-foreground">
              {role === "doctor" ? "You can edit OT details directly from this dashboard." : "You can update ICU beds and nurse allocation directly."}
            </span>
          </div>
        )}

        {/* Circular Meters */}
        <div className="stat-card">
          <h2 className="text-xs font-semibold text-foreground mb-4">Resource Utilization</h2>
          <div className="flex justify-around">
            <CircularMeter value={stats.erLoad} max={100} label="ER Load" color="hsl(210 80% 50%)" />
            <CircularMeter value={8 - stats.icuBeds} max={8} label="ICU Occupancy" color="hsl(352 82% 38%)" />
            <CircularMeter value={28} max={50} label="General Beds" color="hsl(45 90% 50%)" />
            <CircularMeter value={stats.otStatus} max={5} label="OT Usage" color="hsl(142 70% 40%)" />
            <CircularMeter value={stats.doctors} max={20} label="Doctor Load" color="hsl(210 80% 50%)" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
