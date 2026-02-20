import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Activity, Thermometer, Droplets, Heart, AlertTriangle, Wifi, WifiOff, Plus } from "lucide-react";

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  connected: boolean;
  vitals: {
    hr: number;
    bpSys: number;
    bpDia: number;
    spo2: number;
    temp: number;
  };
  riskLevel: "Critical" | "High" | "Moderate" | "Stable";
  complications: string[];
  oxygenDropRisk: number;
  cardiacRisk: number;
}

const generateVital = (base: number, range: number) => Math.round(base + (Math.random() - 0.5) * range);

const initialPatients: Patient[] = [
  { id: "PT-001", name: "Rajesh Kumar", age: 62, gender: "M", connected: true, vitals: { hr: 112, bpSys: 155, bpDia: 98, spo2: 91, temp: 38.8 }, riskLevel: "Critical", complications: ["Cardiac Arrest Risk", "Hypoxemia"], oxygenDropRisk: 78, cardiacRisk: 65 },
  { id: "PT-002", name: "Priya Sharma", age: 45, gender: "F", connected: true, vitals: { hr: 88, bpSys: 130, bpDia: 85, spo2: 95, temp: 37.6 }, riskLevel: "Moderate", complications: ["Mild Hypertension"], oxygenDropRisk: 22, cardiacRisk: 15 },
  { id: "PT-003", name: "Amit Patel", age: 71, gender: "M", connected: true, vitals: { hr: 125, bpSys: 170, bpDia: 105, spo2: 88, temp: 39.2 }, riskLevel: "Critical", complications: ["Sepsis Suspected", "Respiratory Failure"], oxygenDropRisk: 89, cardiacRisk: 72 },
  { id: "PT-004", name: "Sunita Devi", age: 34, gender: "F", connected: true, vitals: { hr: 76, bpSys: 118, bpDia: 76, spo2: 98, temp: 36.9 }, riskLevel: "Stable", complications: [], oxygenDropRisk: 5, cardiacRisk: 3 },
  { id: "PT-005", name: "Mohammed Iqbal", age: 58, gender: "M", connected: false, vitals: { hr: 98, bpSys: 142, bpDia: 92, spo2: 93, temp: 38.1 }, riskLevel: "High", complications: ["Diabetic Emergency"], oxygenDropRisk: 45, cardiacRisk: 38 },
];

const WaveformSVG = ({ hr }: { hr: number }) => {
  const isCritical = hr > 110 || hr < 50;
  return (
    <div className="overflow-hidden h-8 w-full relative">
      <svg viewBox="0 0 200 30" className="w-[200%] h-full vital-wave" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke={isCritical ? "hsl(352 82% 38%)" : "hsl(142 70% 40%)"}
          strokeWidth="1.5"
          points="0,15 10,15 15,15 18,5 20,25 22,10 25,15 40,15 50,15 55,15 58,5 60,25 62,10 65,15 80,15 90,15 95,15 98,5 100,25 102,10 105,15 120,15 130,15 135,15 138,5 140,25 142,10 145,15 160,15 170,15 175,15 178,5 180,25 182,10 185,15 200,15"
        />
      </svg>
    </div>
  );
};

const RiskBadge = ({ level }: { level: string }) => {
  const styles: Record<string, string> = {
    Critical: "bg-primary/20 text-primary border-primary/40 critical-flash",
    High: "bg-medical-yellow/20 text-medical-yellow border-medical-yellow/40",
    Moderate: "bg-medical-blue/20 text-medical-blue border-medical-blue/40",
    Stable: "bg-medical-green/20 text-medical-green border-medical-green/40",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${styles[level] || ""}`}>
      {level}
    </span>
  );
};

const TriagePage = () => {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [selectedId, setSelectedId] = useState<string>("PT-001");
  const [alert, setAlert] = useState<string | null>(null);

  const selected = patients.find((p) => p.id === selectedId)!;

  // Simulate live vitals
  useEffect(() => {
    const interval = setInterval(() => {
      setPatients((prev) =>
        prev.map((p) => {
          if (!p.connected) return p;
          const newVitals = {
            hr: generateVital(p.vitals.hr, 8),
            bpSys: generateVital(p.vitals.bpSys, 6),
            bpDia: generateVital(p.vitals.bpDia, 4),
            spo2: Math.min(100, Math.max(80, generateVital(p.vitals.spo2, 3))),
            temp: Math.round((p.vitals.temp + (Math.random() - 0.5) * 0.3) * 10) / 10,
          };
          let newRisk = p.riskLevel;
          if (newVitals.hr > 120 || newVitals.spo2 < 90 || newVitals.bpSys > 165) {
            newRisk = "Critical";
          } else if (newVitals.hr > 100 || newVitals.spo2 < 93) {
            newRisk = "High";
          }
          if (newRisk === "Critical" && p.riskLevel !== "Critical") {
            setAlert(`${p.name}: Severity Level Updated Due to Vital Instability`);
            setTimeout(() => setAlert(null), 4000);
          }
          return { ...p, vitals: newVitals, riskLevel: newRisk, oxygenDropRisk: Math.min(99, Math.max(5, generateVital(p.oxygenDropRisk, 5))), cardiacRisk: Math.min(99, Math.max(3, generateVital(p.cardiacRisk, 4))) };
        })
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout>
      <div className="animate-fade-up">
        {/* Alert Banner */}
        {alert && (
          <div className="mb-4 p-3 rounded-lg bg-primary/15 border border-primary/40 glow-red-border flex items-center gap-2 animate-fade-up">
            <AlertTriangle size={16} className="text-primary" />
            <span className="text-xs text-primary font-semibold">{alert}</span>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-foreground">AI Triage Module</h1>
            <p className="text-xs text-muted-foreground">Live vital monitoring & AI classification</p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold glow-red hover:bg-primary/90 transition-all">
            <Plus size={14} /> New Patient
          </button>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Patient List */}
          <div className="col-span-3 space-y-2">
            {patients.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                  selectedId === p.id ? "border-primary/40 bg-primary/5 glow-red-border" : "border-border bg-card hover:border-muted-foreground/20"
                } ${p.riskLevel === "Critical" ? "critical-flash" : ""}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-foreground">{p.name}</span>
                  {p.connected ? <div className="status-dot status-dot-connected" /> : <div className="status-dot status-dot-disconnected" />}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{p.id} · {p.age}{p.gender}</span>
                  <RiskBadge level={p.riskLevel} />
                </div>
              </button>
            ))}
          </div>

          {/* Live Vitals Panel */}
          <div className="col-span-5 space-y-3">
            <div className="stat-card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-foreground">🩺 Live Vitals Panel</h2>
                <div className="flex items-center gap-1.5">
                  {selected.connected ? (
                    <>
                      <Wifi size={12} className="text-medical-green" />
                      <span className="text-[10px] text-medical-green font-medium">Streaming from Vital Sign Monitor</span>
                    </>
                  ) : (
                    <>
                      <WifiOff size={12} className="text-primary" />
                      <span className="text-[10px] text-primary font-medium">Disconnected</span>
                    </>
                  )}
                </div>
              </div>

              {/* Waveform */}
              <div className="mb-3 p-2 rounded bg-secondary border border-border">
                <p className="text-[9px] text-muted-foreground mb-1">ECG Waveform</p>
                <WaveformSVG hr={selected.vitals.hr} />
              </div>

              {/* Vital Grid */}
              <div className="grid grid-cols-2 gap-2">
                <VitalBox icon={Heart} label="Heart Rate" value={`${selected.vitals.hr}`} unit="BPM" danger={selected.vitals.hr > 110 || selected.vitals.hr < 50} />
                <VitalBox icon={Activity} label="Blood Pressure" value={`${selected.vitals.bpSys}/${selected.vitals.bpDia}`} unit="mmHg" danger={selected.vitals.bpSys > 160} />
                <VitalBox icon={Droplets} label="SpO₂" value={`${selected.vitals.spo2}`} unit="%" danger={selected.vitals.spo2 < 92} />
                <VitalBox icon={Thermometer} label="Temperature" value={`${selected.vitals.temp.toFixed(1)}`} unit="°C" danger={selected.vitals.temp > 38.5} />
              </div>

              <p className="text-[9px] text-muted-foreground text-right mt-2">Last updated: {new Date().toLocaleTimeString()}</p>
            </div>
          </div>

          {/* AI Analysis Panel */}
          <div className="col-span-4 space-y-3">
            <div className="stat-card">
              <h2 className="text-xs font-semibold text-foreground mb-3">AI Risk Analysis</h2>
              <div className="flex items-center gap-2 mb-4">
                <RiskBadge level={selected.riskLevel} />
                <span className="text-[10px] text-muted-foreground">Auto-classified</span>
              </div>

              {/* Risk Meters */}
              <div className="space-y-3 mb-4">
                <RiskBar label="Oxygen Drop Risk" value={selected.oxygenDropRisk} />
                <RiskBar label="Cardiac Event Risk" value={selected.cardiacRisk} />
              </div>

              {/* Complications */}
              {selected.complications.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] text-muted-foreground mb-1">Predicted Complications</p>
                  {selected.complications.map((c, i) => (
                    <div key={i} className="flex items-center gap-1.5 py-1">
                      <AlertTriangle size={10} className="text-primary" />
                      <span className="text-[11px] text-foreground">{c}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-border pt-3 space-y-2">
                <p className="text-[10px] text-muted-foreground">Suggested Tests</p>
                <div className="flex flex-wrap gap-1">
                  {["CBC", "Troponin", "ABG", "X-Ray Chest", "ECG"].map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded bg-secondary text-[10px] text-secondary-foreground border border-border">{t}</span>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-3 mt-3">
                <p className="text-[10px] text-muted-foreground">Recommended Decision</p>
                <p className="text-xs font-semibold text-primary mt-1">
                  {selected.riskLevel === "Critical" ? "Immediate ICU Admission" : selected.riskLevel === "High" ? "Emergency Ward Admission" : selected.riskLevel === "Moderate" ? "Observation Ward" : "Outpatient Follow-up"}
                </p>
              </div>

              {selected.riskLevel === "Critical" && (
                <div className="mt-3 p-2 rounded bg-primary/10 border border-primary/30 critical-flash">
                  <p className="text-[10px] text-primary font-bold flex items-center gap-1">
                    <AlertTriangle size={10} />
                    Deterioration Detected – Immediate Attention Required
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

const VitalBox = ({ icon: Icon, label, value, unit, danger }: { icon: any; label: string; value: string; unit: string; danger: boolean }) => (
  <div className={`p-2.5 rounded-lg border transition-all duration-300 ${danger ? "border-primary/40 bg-primary/5 glow-red-border" : "border-border bg-secondary"}`}>
    <div className="flex items-center gap-1.5 mb-1">
      <Icon size={12} className={danger ? "text-primary" : "text-muted-foreground"} />
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
    <p className={`text-lg font-bold ${danger ? "text-primary" : "text-foreground"}`}>
      {value} <span className="text-[10px] font-normal text-muted-foreground">{unit}</span>
    </p>
  </div>
);

const RiskBar = ({ label, value }: { label: string; value: number }) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className={`text-[10px] font-bold ${value > 60 ? "text-primary" : value > 30 ? "text-medical-yellow" : "text-medical-green"}`}>{value}%</span>
    </div>
    <div className="h-1.5 rounded-full bg-secondary">
      <div
        className={`h-full rounded-full transition-all duration-1000 ${value > 60 ? "bg-primary" : value > 30 ? "bg-medical-yellow" : "bg-medical-green"}`}
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

export default TriagePage;
