import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Activity, Thermometer, Droplets, Heart, AlertTriangle, Wifi, WifiOff, Plus, Stethoscope, Brain } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { usePatients, shouldShowLiveVitals, PatientVitals } from "@/contexts/PatientContext";
import { useNavigate } from "react-router-dom";

// AI recommendation engine
const getAIRecommendations = (diagnosis: string, vitals: PatientVitals, riskLevel: string) => {
  const diag = diagnosis.toLowerCase();
  const recs: { step: string; priority: "critical" | "high" | "routine" }[] = [];
  if (diag.includes("mi") || diag.includes("myocardial") || diag.includes("heart attack") || diag.includes("cardiac")) {
    recs.push({ step: "Administer Aspirin 300mg + Clopidogrel 600mg stat", priority: "critical" }, { step: "12-lead ECG immediately", priority: "critical" }, { step: "Serial Troponin I at 0, 3, 6 hours", priority: "high" }, { step: "Prepare for PCI – alert Cath Lab", priority: "critical" }, { step: "IV Heparin drip per protocol", priority: "high" });
  } else if (diag.includes("pneumonia") || diag.includes("respiratory") || diag.includes("lung")) {
    recs.push({ step: "Chest X-ray PA view", priority: "critical" }, { step: "Start Ceftriaxone + Azithromycin", priority: "critical" }, { step: "ABG analysis", priority: "high" }, { step: vitals.spo2 < 92 ? "High-flow O₂ via non-rebreather" : "Supplemental O₂ nasal cannula", priority: vitals.spo2 < 92 ? "critical" : "routine" });
  } else if (diag.includes("sepsis") || diag.includes("septic")) {
    recs.push({ step: "STAT blood cultures x2", priority: "critical" }, { step: "IV fluid bolus 30ml/kg within 1 hour", priority: "critical" }, { step: "Broad-spectrum antibiotics within 1 hour", priority: "critical" }, { step: "Serum Lactate – repeat in 2 hours", priority: "high" });
  } else if (diag.includes("stroke") || diag.includes("cva")) {
    recs.push({ step: "STAT CT Head without contrast", priority: "critical" }, { step: "Assess tPA eligibility (4.5hr window)", priority: "critical" }, { step: "NIH Stroke Scale", priority: "high" }, { step: "Neurology consult ASAP", priority: "critical" });
  } else if (diag.includes("diabetes") || diag.includes("dka") || diag.includes("diabetic")) {
    recs.push({ step: "STAT blood glucose + HbA1c + BMP", priority: "critical" }, { step: "Insulin drip if BG > 250", priority: "critical" }, { step: "IV NS bolus 1L", priority: "high" }, { step: "Monitor potassium q2h", priority: "high" });
  } else if (diag.includes("fracture") || diag.includes("trauma")) {
    recs.push({ step: "X-ray AP and lateral views", priority: "critical" }, { step: "Pain management – IV Morphine/Ketorolac", priority: "high" }, { step: "Immobilize with splint", priority: "high" }, { step: "Ortho consult", priority: "high" });
  } else if (diag.trim().length > 0) {
    recs.push({ step: "Comprehensive metabolic panel + CBC", priority: "high" }, { step: "Targeted imaging", priority: "high" }, { step: "Serial vital sign monitoring q15min", priority: riskLevel === "Critical" ? "critical" : "routine" });
  }
  return recs;
};

const WaveformSVG = ({ hr }: { hr: number }) => {
  const isCritical = hr > 110 || hr < 50;
  return (
    <div className="overflow-hidden h-8 w-full relative">
      <svg viewBox="0 0 200 30" className="w-[200%] h-full vital-wave" preserveAspectRatio="none">
        <polyline fill="none" stroke={isCritical ? "hsl(352 82% 38%)" : "hsl(142 70% 40%)"} strokeWidth="1.5"
          points="0,15 10,15 15,15 18,5 20,25 22,10 25,15 40,15 50,15 55,15 58,5 60,25 62,10 65,15 80,15 90,15 95,15 98,5 100,25 102,10 105,15 120,15 130,15 135,15 138,5 140,25 142,10 145,15 160,15 170,15 175,15 178,5 180,25 182,10 185,15 200,15" />
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
      <div className={`h-full rounded-full transition-all duration-1000 ${value > 60 ? "bg-primary" : value > 30 ? "bg-medical-yellow" : "bg-medical-green"}`} style={{ width: `${value}%` }} />
    </div>
  </div>
);

const TriagePage = () => {
  const { role } = useRole();
  const { patients, updateDiagnosis, addManualVitals } = usePatients();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string>(patients[0]?.id || "");
  const [alert, setAlert] = useState<string | null>(null);
  const [diagnosisInput, setDiagnosisInput] = useState("");
  const [prevRiskLevels, setPrevRiskLevels] = useState<Record<string, string>>({});

  // Manual vitals for non-live patients
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualHr, setManualHr] = useState("");
  const [manualBpSys, setManualBpSys] = useState("");
  const [manualBpDia, setManualBpDia] = useState("");
  const [manualSpo2, setManualSpo2] = useState("");
  const [manualTemp, setManualTemp] = useState("");

  const selected = patients.find(p => p.id === selectedId) || patients[0];
  const canDiagnose = role === "doctor" || role === "admin";
  const canEnterVitals = role === "nurse" || role === "admin";
  const isLive = shouldShowLiveVitals(selected?.riskLevel);
  const aiRecommendations = selected ? getAIRecommendations(selected.diagnosis, selected.vitals, selected.riskLevel) : [];

  useEffect(() => {
    if (selected) setDiagnosisInput(selected.diagnosis);
  }, [selectedId]);

  // Detect risk level changes for alert
  useEffect(() => {
    patients.forEach(p => {
      if (prevRiskLevels[p.id] && prevRiskLevels[p.id] !== "Critical" && p.riskLevel === "Critical") {
        setAlert(`${p.name}: Severity Level Updated Due to Vital Instability`);
        setTimeout(() => setAlert(null), 4000);
      }
    });
    const levels: Record<string, string> = {};
    patients.forEach(p => { levels[p.id] = p.riskLevel; });
    setPrevRiskLevels(levels);
  }, [patients]);

  const handleSaveDiagnosis = () => {
    if (selected) updateDiagnosis(selected.id, diagnosisInput);
  };

  const handleManualVitals = () => {
    if (!selected || !manualHr || !manualBpSys || !manualBpDia || !manualSpo2 || !manualTemp) return;
    addManualVitals(selected.id, {
      hr: parseInt(manualHr), bpSys: parseInt(manualBpSys), bpDia: parseInt(manualBpDia),
      spo2: parseInt(manualSpo2), temp: parseFloat(manualTemp),
    }, role);
    setShowManualForm(false);
    setManualHr(""); setManualBpSys(""); setManualBpDia(""); setManualSpo2(""); setManualTemp("");
  };

  if (!selected) return <DashboardLayout><p className="text-muted-foreground text-sm">No patients</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="animate-fade-up">
        {alert && (
          <div className="mb-4 p-3 rounded-lg bg-primary/15 border border-primary/40 glow-red-border flex items-center gap-2 animate-fade-up">
            <AlertTriangle size={16} className="text-primary" />
            <span className="text-xs text-primary font-semibold">{alert}</span>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-foreground">AI Triage Module</h1>
            <p className="text-xs text-muted-foreground">Live vital monitoring & AI classification · <span className="text-primary font-semibold capitalize">{role}</span></p>
          </div>
          <button onClick={() => navigate("/register")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold glow-red hover:bg-primary/90 transition-all">
            <Plus size={14} /> New Patient
          </button>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Patient List */}
          <div className="col-span-3 space-y-2 max-h-[calc(100vh-140px)] overflow-y-auto">
            {patients.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                  selectedId === p.id ? "border-primary/40 bg-primary/5 glow-red-border" : "border-border bg-card hover:border-muted-foreground/20"
                } ${p.riskLevel === "Critical" ? "critical-flash" : ""}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-foreground">{p.name}</span>
                  {shouldShowLiveVitals(p.riskLevel) && p.connected ? <div className="status-dot status-dot-connected" /> : !shouldShowLiveVitals(p.riskLevel) ? null : <div className="status-dot status-dot-disconnected" />}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{p.id} · {p.age}{p.gender}</span>
                  <RiskBadge level={p.riskLevel} />
                </div>
                {!shouldShowLiveVitals(p.riskLevel) && (
                  <span className="text-[9px] text-muted-foreground mt-1 block">Manual vitals only</span>
                )}
              </button>
            ))}
          </div>

          {/* Live Vitals Panel */}
          <div className="col-span-5 space-y-3">
            <div className="stat-card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-foreground">
                  {isLive ? "🩺 Live Vitals Panel" : "📋 Manually Recorded Vitals"}
                </h2>
                <div className="flex items-center gap-1.5">
                  {isLive ? (
                    selected.connected ? (
                      <><Wifi size={12} className="text-medical-green" /><span className="text-[10px] text-medical-green font-medium">Streaming from Monitor</span></>
                    ) : (
                      <><WifiOff size={12} className="text-primary" /><span className="text-[10px] text-primary font-medium">Disconnected</span></>
                    )
                  ) : (
                    <span className="text-[10px] text-muted-foreground">Nurse-entered data</span>
                  )}
                </div>
              </div>

              {/* ECG only for live */}
              {isLive && (
                <div className="mb-3 p-2 rounded bg-secondary border border-border">
                  <p className="text-[9px] text-muted-foreground mb-1">ECG Waveform</p>
                  <WaveformSVG hr={selected.vitals.hr} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <VitalBox icon={Heart} label="Heart Rate" value={`${selected.vitals.hr}`} unit="BPM" danger={selected.vitals.hr > 110 || selected.vitals.hr < 50} />
                <VitalBox icon={Activity} label="Blood Pressure" value={`${selected.vitals.bpSys}/${selected.vitals.bpDia}`} unit="mmHg" danger={selected.vitals.bpSys > 160} />
                <VitalBox icon={Droplets} label="SpO₂" value={`${selected.vitals.spo2}`} unit="%" danger={selected.vitals.spo2 < 92} />
                <VitalBox icon={Thermometer} label="Temperature" value={`${selected.vitals.temp.toFixed(1)}`} unit="°C" danger={selected.vitals.temp > 38.5} />
              </div>

              {isLive && <p className="text-[9px] text-muted-foreground text-right mt-2">Last updated: {new Date().toLocaleTimeString()}</p>}

              {/* Manual vitals entry */}
              {!isLive && canEnterVitals && (
                <div className="mt-3 pt-3 border-t border-border">
                  {!showManualForm ? (
                    <button onClick={() => setShowManualForm(true)} className="w-full py-2 rounded-lg bg-secondary border border-border text-xs text-foreground hover:border-primary/30 transition-all flex items-center justify-center gap-1.5">
                      <Plus size={12} /> Enter New Vitals
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[10px] text-muted-foreground font-semibold">Enter Vitals Manually</p>
                      <div className="grid grid-cols-5 gap-2">
                        {[
                          { label: "HR", val: manualHr, set: setManualHr, ph: "BPM" },
                          { label: "BP Sys", val: manualBpSys, set: setManualBpSys, ph: "mmHg" },
                          { label: "BP Dia", val: manualBpDia, set: setManualBpDia, ph: "mmHg" },
                          { label: "SpO₂", val: manualSpo2, set: setManualSpo2, ph: "%" },
                          { label: "Temp", val: manualTemp, set: setManualTemp, ph: "°C" },
                        ].map(f => (
                          <div key={f.label}>
                            <label className="text-[9px] text-muted-foreground">{f.label}</label>
                            <input type="number" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                              className="w-full bg-card border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary/50 transition-all" />
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleManualVitals} className="flex-1 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all">Save Vitals</button>
                        <button onClick={() => setShowManualForm(false)} className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs text-muted-foreground">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Manual vitals history */}
              {!isLive && selected.manualVitals.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-[10px] text-muted-foreground mb-2">Vitals History</p>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {[...selected.manualVitals].reverse().map((mv, i) => (
                      <div key={i} className="flex items-center justify-between text-[10px] py-1 border-b border-border/30">
                        <span className="text-muted-foreground">{mv.recordedAt}</span>
                        <span className="text-foreground font-mono">HR:{mv.vitals.hr} BP:{mv.vitals.bpSys}/{mv.vitals.bpDia} SpO₂:{mv.vitals.spo2}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Diagnosis */}
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-3">
                <Stethoscope size={14} className="text-primary" />
                <h2 className="text-xs font-semibold text-foreground">Doctor's Diagnosis</h2>
                {!canDiagnose && <span className="text-[9px] text-muted-foreground ml-auto">(Doctor access only)</span>}
              </div>
              {selected.diagnosis && (
                <div className="mb-3 p-2 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Current Diagnosis</p>
                  <p className="text-xs text-foreground font-semibold">{selected.diagnosis}</p>
                </div>
              )}
              {canDiagnose ? (
                <div className="space-y-2">
                  <textarea value={diagnosisInput} onChange={e => setDiagnosisInput(e.target.value)}
                    placeholder="Enter diagnosis (e.g., Acute MI, Pneumonia, Sepsis...)"
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all resize-none h-20" />
                  <button onClick={handleSaveDiagnosis} className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5">
                    <Brain size={12} /> Save & Generate AI Recommendations
                  </button>
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground italic">{selected.diagnosis ? "Diagnosis by attending physician." : "No diagnosis yet. Doctor access only."}</p>
              )}
            </div>
          </div>

          {/* AI Analysis Panel */}
          <div className="col-span-4 space-y-3">
            <div className="stat-card">
              <h2 className="text-xs font-semibold text-foreground mb-3">AI Risk Analysis</h2>
              <div className="flex items-center gap-2 mb-4">
                <RiskBadge level={selected.riskLevel} />
                <span className="text-[10px] text-muted-foreground">
                  {isLive ? "Auto-classified from live vitals" : "Classified from manual entry"}
                </span>
              </div>
              <div className="space-y-3 mb-4">
                <RiskBar label="Oxygen Drop Risk" value={selected.oxygenDropRisk} />
                <RiskBar label="Cardiac Event Risk" value={selected.cardiacRisk} />
              </div>
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
              <div className="border-t border-border pt-3">
                <p className="text-[10px] text-muted-foreground">Recommended Decision</p>
                <p className="text-xs font-semibold text-primary mt-1">
                  {selected.riskLevel === "Critical" ? "Immediate ICU Admission" : selected.riskLevel === "High" ? "Emergency Ward Admission" : selected.riskLevel === "Moderate" ? "Observation Ward" : "Outpatient Follow-up"}
                </p>
              </div>
              {selected.riskLevel === "Critical" && (
                <div className="mt-3 p-2 rounded bg-primary/10 border border-primary/30 critical-flash">
                  <p className="text-[10px] text-primary font-bold flex items-center gap-1">
                    <AlertTriangle size={10} /> Deterioration Detected – Immediate Attention Required
                  </p>
                </div>
              )}
            </div>

            {selected.diagnosis && aiRecommendations.length > 0 && (
              <div className="stat-card">
                <div className="flex items-center gap-2 mb-3">
                  <Brain size={14} className="text-primary" />
                  <h2 className="text-xs font-semibold text-foreground">AI Recommended Steps</h2>
                </div>
                <p className="text-[9px] text-muted-foreground mb-3">Based on: <span className="text-primary font-semibold">{selected.diagnosis}</span></p>
                <div className="space-y-1.5">
                  {aiRecommendations.map((rec, i) => {
                    const styles = { critical: "border-primary/30 bg-primary/5", high: "border-medical-yellow/30 bg-medical-yellow/5", routine: "border-border bg-secondary" };
                    const labels = { critical: "CRITICAL", high: "HIGH", routine: "ROUTINE" };
                    const labelStyles = { critical: "bg-primary/20 text-primary", high: "bg-medical-yellow/20 text-medical-yellow", routine: "bg-muted text-muted-foreground" };
                    return (
                      <div key={i} className={`p-2 rounded-lg border ${styles[rec.priority]}`}>
                        <div className="flex items-start gap-2">
                          <span className={`text-[8px] font-bold px-1 py-0.5 rounded shrink-0 mt-0.5 ${labelStyles[rec.priority]}`}>{labels[rec.priority]}</span>
                          <span className="text-[11px] text-foreground">{rec.step}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[8px] text-muted-foreground mt-3 italic">⚕️ AI-generated – clinical judgment supersedes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TriagePage;
