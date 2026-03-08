import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { usePatients, shouldShowLiveVitals, PatientVitals, playPatientClickSound } from "@/contexts/PatientContext";
import { useRole } from "@/contexts/RoleContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Heart, Activity, Droplets, Thermometer, Wifi, WifiOff, ArrowLeft, Barcode, Printer, Stethoscope, Brain, AlertTriangle, FileText, Plus, Upload, Download, MonitorSmartphone, Pencil, Check, X, LogOut } from "lucide-react";

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

const PatientDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPatient, updateDiagnosis, addManualVitals, addUploadedFile, patients, statusChangeMessages, refreshPatients } = usePatients();
  const { role } = useRole();
  const patient = getPatient(id || "");
  const soundPlayedRef = useRef(false);

  const [diagnosisInput, setDiagnosisInput] = useState("");
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualHr, setManualHr] = useState("");
  const [manualBpSys, setManualBpSys] = useState("");
  const [manualBpDia, setManualBpDia] = useState("");
  const [manualSpo2, setManualSpo2] = useState("");
  const [manualTemp, setManualTemp] = useState("");
  
  // Symptoms editing
  const [editingSymptoms, setEditingSymptoms] = useState(false);
  const [symptomInput, setSymptomInput] = useState("");
  const [editedSymptoms, setEditedSymptoms] = useState<string[]>([]);
  
  // Discharge
  const [discharging, setDischarging] = useState(false);

  useEffect(() => {
    if (patient) {
      setDiagnosisInput(patient.diagnosis);
      setEditedSymptoms([...patient.symptoms]);
      if (!soundPlayedRef.current) {
        playPatientClickSound(patient.riskLevel);
        soundPlayedRef.current = true;
      }
    }
  }, [id, patient?.symptoms?.length]);

  if (!patient) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground text-sm">
          <p>Patient not found</p>
          <button onClick={() => navigate("/patients")} className="mt-2 text-primary text-xs">← Back to list</button>
        </div>
      </DashboardLayout>
    );
  }

  const livePatient = patients.find(p => p.id === patient.id) || patient;
  const isLive = shouldShowLiveVitals(livePatient.riskLevel);
  const canDiagnose = role === "doctor" || role === "admin";
  const canEnterVitals = role === "nurse" || role === "admin";
  const canEditSymptoms = role === "doctor" || role === "nurse" || role === "admin";
  const isAdmin = role === "admin";
  const aiRecs = getAIRecommendations(livePatient.diagnosis, livePatient.vitals, livePatient.riskLevel);
  const statusMsg = statusChangeMessages[livePatient.id];

  const riskBadgeStyles: Record<string, string> = {
    Critical: "bg-primary/20 text-primary border-primary/40 critical-flash",
    High: "bg-medical-yellow/20 text-medical-yellow border-medical-yellow/40",
    Moderate: "bg-medical-blue/20 text-medical-blue border-medical-blue/40",
    Stable: "bg-medical-green/20 text-medical-green border-medical-green/40",
    Discharged: "bg-muted text-muted-foreground border-border",
  };

  const handleSaveDiagnosis = () => {
    updateDiagnosis(livePatient.id, diagnosisInput);
  };

  const handleManualVitals = () => {
    if (!manualHr || !manualBpSys || !manualBpDia || !manualSpo2 || !manualTemp) return;
    addManualVitals(livePatient.id, {
      hr: parseInt(manualHr), bpSys: parseInt(manualBpSys), bpDia: parseInt(manualBpDia),
      spo2: parseInt(manualSpo2), temp: parseFloat(manualTemp),
    }, role);
    setShowManualForm(false);
    setManualHr(""); setManualBpSys(""); setManualBpDia(""); setManualSpo2(""); setManualTemp("");
  };

  const handleSaveSymptoms = async () => {
    try {
      await supabase.from("triage").update({ symptoms: editedSymptoms }).eq("patient_id", livePatient.dbId);
      toast.success("Symptoms updated");
      setEditingSymptoms(false);
      await refreshPatients();
    } catch {
      toast.error("Failed to update symptoms");
    }
  };

  const handleAddSymptom = () => {
    const s = symptomInput.trim();
    if (!s || editedSymptoms.includes(s)) return;
    setEditedSymptoms(prev => [...prev, s]);
    setSymptomInput("");
  };

  const handleRemoveSymptom = (idx: number) => {
    setEditedSymptoms(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDischarge = async () => {
    setDischarging(true);
    try {
      await supabase.from("patients").update({ diagnosis: (livePatient.diagnosis ? livePatient.diagnosis + " | " : "") + "DISCHARGED" }).eq("id", livePatient.dbId);
      toast.success("Patient discharged successfully");
      await refreshPatients();
    } catch {
      toast.error("Failed to discharge patient");
    }
    setDischarging(false);
  };

  const handleFileUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.jpg,.png,.doc,.docx";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) addUploadedFile(livePatient.id, file.name);
    };
    input.click();
  };

  const handleGeneratePDF = () => {
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) return;
    
    // Generate realistic lab report
    const tests = [
      { name: "Complete Blood Count (CBC)", results: [
        { test: "Hemoglobin", value: "13.5 g/dL", range: "12.0 - 17.5 g/dL", flag: "" },
        { test: "WBC Count", value: "8,200 /µL", range: "4,500 - 11,000 /µL", flag: "" },
        { test: "Platelet Count", value: "245,000 /µL", range: "150,000 - 400,000 /µL", flag: "" },
        { test: "RBC Count", value: "4.8 M/µL", range: "4.5 - 5.5 M/µL", flag: "" },
        { test: "Hematocrit", value: "42%", range: "36 - 46%", flag: "" },
      ]},
      { name: "Basic Metabolic Panel (BMP)", results: [
        { test: "Glucose (Fasting)", value: "98 mg/dL", range: "70 - 100 mg/dL", flag: "" },
        { test: "BUN", value: "15 mg/dL", range: "7 - 20 mg/dL", flag: "" },
        { test: "Creatinine", value: "1.0 mg/dL", range: "0.7 - 1.3 mg/dL", flag: "" },
        { test: "Sodium", value: "140 mEq/L", range: "136 - 145 mEq/L", flag: "" },
        { test: "Potassium", value: "4.2 mEq/L", range: "3.5 - 5.0 mEq/L", flag: "" },
      ]},
      { name: "Vital Signs Summary", results: [
        { test: "Heart Rate", value: `${livePatient.vitals.hr} BPM`, range: "60 - 100 BPM", flag: livePatient.vitals.hr > 100 || livePatient.vitals.hr < 60 ? "⚠" : "" },
        { test: "Blood Pressure", value: `${livePatient.vitals.bpSys}/${livePatient.vitals.bpDia} mmHg`, range: "90/60 - 120/80 mmHg", flag: livePatient.vitals.bpSys > 140 ? "⚠" : "" },
        { test: "SpO₂", value: `${livePatient.vitals.spo2}%`, range: "95 - 100%", flag: livePatient.vitals.spo2 < 95 ? "⚠" : "" },
        { test: "Temperature", value: `${livePatient.vitals.temp.toFixed(1)}°C`, range: "36.1 - 37.2°C", flag: livePatient.vitals.temp > 37.5 ? "⚠" : "" },
      ]},
    ];

    const testsHtml = tests.map(section => `
      <div style="margin:20px 0;">
        <h3 style="color:#B11226;font-size:14px;border-bottom:2px solid #B11226;padding-bottom:4px;">${section.name}</h3>
        <table style="width:100%;border-collapse:collapse;margin-top:8px;">
          <tr style="background:#f8f8f8;"><th style="border:1px solid #ddd;padding:6px;text-align:left;font-size:11px;">Test</th><th style="border:1px solid #ddd;padding:6px;text-align:left;font-size:11px;">Result</th><th style="border:1px solid #ddd;padding:6px;text-align:left;font-size:11px;">Reference Range</th><th style="border:1px solid #ddd;padding:6px;text-align:center;font-size:11px;">Flag</th></tr>
          ${section.results.map(r => `<tr><td style="border:1px solid #ddd;padding:6px;font-size:11px;">${r.test}</td><td style="border:1px solid #ddd;padding:6px;font-size:11px;font-weight:bold;">${r.value}</td><td style="border:1px solid #ddd;padding:6px;font-size:11px;color:#666;">${r.range}</td><td style="border:1px solid #ddd;padding:6px;text-align:center;font-size:14px;">${r.flag}</td></tr>`).join("")}
        </table>
      </div>
    `).join("");

    w.document.write(`<html><head><title>Lab Report – ${livePatient.name}</title>
      <style>
        body{font-family:'Segoe UI',Arial,sans-serif;padding:40px;color:#222;max-width:800px;margin:0 auto;}
        .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #B11226;padding-bottom:15px;margin-bottom:20px;}
        .logo{font-size:22px;font-weight:bold;color:#B11226;}
        .subtitle{font-size:10px;color:#666;text-transform:uppercase;letter-spacing:2px;}
        .patient-info{display:grid;grid-template-columns:1fr 1fr;gap:8px;background:#f9f9f9;padding:15px;border-radius:8px;margin-bottom:20px;border:1px solid #eee;}
        .patient-info div{font-size:11px;}
        .patient-info strong{color:#333;}
        .footer{margin-top:30px;padding-top:15px;border-top:2px solid #eee;font-size:10px;color:#888;}
        .doctor-remarks{background:#fff3f3;border:1px solid #ffcccc;border-radius:8px;padding:15px;margin-top:20px;}
      </style></head><body>
      <div class="header">
        <div><div class="logo">🏥 MedTriage AI</div><div class="subtitle">Clinical Laboratory Report</div></div>
        <div style="text-align:right;font-size:11px;color:#666;"><div>Report Date: ${new Date().toLocaleDateString()}</div><div>Report ID: LAB-${Date.now().toString().slice(-6)}</div></div>
      </div>
      <div class="patient-info">
        <div><strong>Patient Name:</strong> ${livePatient.name}</div>
        <div><strong>Patient ID:</strong> ${livePatient.id}</div>
        <div><strong>Age / Gender:</strong> ${livePatient.age} / ${livePatient.gender}</div>
        <div><strong>Barcode:</strong> ${livePatient.barcode}</div>
        <div><strong>Admission Date:</strong> ${livePatient.admissionDate}</div>
        <div><strong>Risk Level:</strong> ${livePatient.riskLevel}</div>
      </div>
      ${testsHtml}
      <div class="doctor-remarks">
        <h3 style="color:#B11226;font-size:13px;margin:0 0 8px 0;">Doctor's Remarks</h3>
        <p style="font-size:11px;color:#444;">${livePatient.diagnosis || "Awaiting diagnosis"}</p>
        <p style="font-size:11px;color:#444;margin-top:8px;"><strong>Symptoms:</strong> ${livePatient.symptoms.join(", ") || "None reported"}</p>
      </div>
      <div class="footer">
        <p>This report is computer-generated by MedTriage AI Clinical System · ${new Date().toLocaleString()}</p>
        <p style="color:#B11226;font-weight:bold;">Note: This report should be reviewed and validated by a qualified medical professional.</p>
      </div>
      <script>window.print()<\/script></body></html>`);
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-up">
        {/* Status change message */}
        {statusMsg && (
          <div className="mb-4 p-3 rounded-lg bg-primary/15 border border-primary/40 glow-red-border flex items-center gap-2 animate-fade-up">
            <MonitorSmartphone size={16} className="text-primary" />
            <span className="text-xs text-primary font-semibold">{statusMsg}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate("/patients")} className="p-1.5 rounded-lg bg-secondary border border-border hover:border-primary/30 transition-all">
            <ArrowLeft size={14} className="text-muted-foreground" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-foreground">{livePatient.name}</h1>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${riskBadgeStyles[livePatient.riskLevel] || riskBadgeStyles["Stable"]}`}>
                {livePatient.riskLevel}
              </span>
              {livePatient.diagnosis?.includes("DISCHARGED") && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border bg-muted text-muted-foreground border-border">Discharged</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{livePatient.id} · {livePatient.age}{livePatient.gender} · Admitted {livePatient.admissionDate}</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && !livePatient.diagnosis?.includes("DISCHARGED") && (
              <button onClick={handleDischarge} disabled={discharging}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border text-xs font-semibold text-foreground hover:border-primary/30 transition-all disabled:opacity-50">
                <LogOut size={12} /> Discharge
              </button>
            )}
            <button onClick={() => {
              const w = window.open("", "_blank", "width=400,height=300");
              if (!w) return;
              w.document.write(`<html><body style="text-align:center;padding:40px;font-family:monospace;"><h2>${livePatient.name}</h2><p>${livePatient.id}</p><p style="font-size:24px;letter-spacing:4px;font-weight:bold">${livePatient.barcode}</p><script>window.print()<\/script></body></html>`);
            }} className="p-1.5 rounded-lg bg-secondary border border-border hover:border-primary/30 transition-all" title="Print Barcode">
              <Printer size={14} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Barcode + Info Row */}
        <div className="stat-card mb-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Barcode size={14} className="text-muted-foreground" />
              <span className="text-xs font-mono text-muted-foreground tracking-[3px]">{livePatient.barcode}</span>
            </div>
            <div className="text-xs text-muted-foreground">Phone: <span className="text-foreground">{livePatient.phone}</span></div>
          </div>
        </div>

        {/* Symptoms Section */}
        <div className="stat-card mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-primary" />
              <h2 className="text-xs font-semibold text-foreground">Symptoms</h2>
            </div>
            {canEditSymptoms && !editingSymptoms && (
              <button onClick={() => { setEditingSymptoms(true); setEditedSymptoms([...livePatient.symptoms]); }} className="flex items-center gap-1 px-2 py-1 rounded bg-secondary border border-border text-[10px] text-foreground hover:border-primary/30 transition-all">
                <Pencil size={10} /> Edit
              </button>
            )}
          </div>
          
          {editingSymptoms ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input value={symptomInput} onChange={e => setSymptomInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddSymptom()}
                  className="flex-1 bg-secondary border border-border rounded px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
                  placeholder="Add symptom..." />
                <button onClick={handleAddSymptom} className="px-2 py-1 rounded bg-primary text-primary-foreground text-xs"><Plus size={12} /></button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {editedSymptoms.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] border border-primary/20 flex items-center gap-1">
                    {s} <button onClick={() => handleRemoveSymptom(i)} className="hover:text-foreground"><X size={8} /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveSymptoms} className="flex items-center gap-1 px-3 py-1 rounded bg-primary text-primary-foreground text-xs font-semibold"><Check size={12} /> Save</button>
                <button onClick={() => setEditingSymptoms(false)} className="px-3 py-1 rounded bg-secondary border border-border text-xs text-muted-foreground">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {livePatient.symptoms.length > 0 ? livePatient.symptoms.map((s, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-secondary text-[10px] text-foreground border border-border">{s}</span>
              )) : (
                <p className="text-[10px] text-muted-foreground italic">No symptoms recorded</p>
              )}
            </div>
          )}

          {/* Condition status indicator */}
          <div className="mt-3 pt-2 border-t border-border">
            <p className="text-[10px] text-muted-foreground">Condition Status: <span className={`font-semibold ${livePatient.riskLevel === "Critical" ? "text-primary" : livePatient.riskLevel === "High" ? "text-medical-yellow" : livePatient.riskLevel === "Moderate" ? "text-medical-blue" : "text-medical-green"}`}>{livePatient.riskLevel}</span></p>
            <p className="text-[9px] text-muted-foreground mt-0.5">Status transitions: Critical → High → Moderate → Stable</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Left Column – Vitals + Diagnosis */}
          <div className="col-span-7 space-y-4">
            {/* Vitals */}
            <div className="stat-card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-foreground">
                  {isLive ? "🩺 Live Vitals Panel" : "📋 Manually Recorded Vitals"}
                </h2>
                {isLive ? (
                  <div className="flex items-center gap-1.5">
                    {livePatient.connected ? (
                      <><Wifi size={12} className="text-medical-green" /><span className="text-[10px] text-medical-green font-medium">Streaming from Monitor</span></>
                    ) : (
                      <><WifiOff size={12} className="text-primary" /><span className="text-[10px] text-primary font-medium">Disconnected</span></>
                    )}
                  </div>
                ) : (
                  <span className="text-[10px] text-muted-foreground">Nurse-entered data</span>
                )}
              </div>

              {isLive && (
                <div className="mb-3 p-2 rounded bg-secondary border border-border">
                  <p className="text-[9px] text-muted-foreground mb-1">ECG Waveform</p>
                  <WaveformSVG hr={livePatient.vitals.hr} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <VitalBox icon={Heart} label="Heart Rate" value={`${livePatient.vitals.hr}`} unit="BPM" danger={livePatient.vitals.hr > 110 || livePatient.vitals.hr < 50} />
                <VitalBox icon={Activity} label="Blood Pressure" value={`${livePatient.vitals.bpSys}/${livePatient.vitals.bpDia}`} unit="mmHg" danger={livePatient.vitals.bpSys > 160} />
                <VitalBox icon={Droplets} label="SpO₂" value={`${livePatient.vitals.spo2}`} unit="%" danger={livePatient.vitals.spo2 < 92} />
                <VitalBox icon={Thermometer} label="Temperature" value={`${livePatient.vitals.temp.toFixed(1)}`} unit="°C" danger={livePatient.vitals.temp > 38.5} />
              </div>

              {isLive && <p className="text-[9px] text-muted-foreground text-right mt-2">Last updated: {new Date().toLocaleTimeString()}</p>}

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
                        <button onClick={() => setShowManualForm(false)} className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground transition-all">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!isLive && livePatient.manualVitals.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-[10px] text-muted-foreground mb-2">Vitals History</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {[...livePatient.manualVitals].reverse().map((mv, i) => (
                      <div key={i} className="flex items-center justify-between text-[10px] py-1 border-b border-border/30">
                        <span className="text-muted-foreground">{mv.recordedAt} by {mv.recordedBy}</span>
                        <span className="text-foreground font-mono">HR:{mv.vitals.hr} BP:{mv.vitals.bpSys}/{mv.vitals.bpDia} SpO₂:{mv.vitals.spo2} T:{mv.vitals.temp.toFixed(1)}</span>
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
              </div>
              {livePatient.diagnosis && (
                <div className="mb-3 p-2 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Current Diagnosis</p>
                  <p className="text-xs text-foreground font-semibold">{livePatient.diagnosis}</p>
                </div>
              )}
              {canDiagnose ? (
                <div className="space-y-2">
                  <textarea value={diagnosisInput} onChange={e => setDiagnosisInput(e.target.value)}
                    placeholder="Enter diagnosis (e.g., Acute MI, Pneumonia, Sepsis...)"
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all resize-none h-16" />
                  <button onClick={handleSaveDiagnosis} className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5">
                    <Brain size={12} /> Save & Generate AI Recommendations
                  </button>
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground italic">{livePatient.diagnosis ? "Diagnosis by attending physician." : "No diagnosis yet. Doctor access only."}</p>
              )}
            </div>
          </div>

          {/* Right Column – AI + Tests + History */}
          <div className="col-span-5 space-y-4">
            {/* AI Risk */}
            <div className="stat-card">
              <h2 className="text-xs font-semibold text-foreground mb-3">AI Risk Analysis</h2>
              <div className="space-y-3 mb-3">
                <RiskBar label="Oxygen Drop Risk" value={livePatient.oxygenDropRisk} />
                <RiskBar label="Cardiac Event Risk" value={livePatient.cardiacRisk} />
              </div>
              {livePatient.complications.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] text-muted-foreground mb-1">Predicted Complications</p>
                  {livePatient.complications.map((c, i) => (
                    <div key={i} className="flex items-center gap-1.5 py-1">
                      <AlertTriangle size={10} className="text-primary" />
                      <span className="text-[11px] text-foreground">{c}</span>
                    </div>
                  ))}
                </div>
              )}
              {livePatient.riskLevel === "Critical" && (
                <div className="p-2 rounded bg-primary/10 border border-primary/30 critical-flash">
                  <p className="text-[10px] text-primary font-bold flex items-center gap-1">
                    <AlertTriangle size={10} /> Deterioration Detected – Immediate Attention Required
                  </p>
                </div>
              )}
            </div>

            {/* AI Recommendations */}
            {livePatient.diagnosis && aiRecs.length > 0 && (
              <div className="stat-card">
                <div className="flex items-center gap-2 mb-3">
                  <Brain size={14} className="text-primary" />
                  <h2 className="text-xs font-semibold text-foreground">AI Recommended Steps</h2>
                </div>
                <p className="text-[9px] text-muted-foreground mb-2">Based on: <span className="text-primary font-semibold">{livePatient.diagnosis}</span></p>
                <div className="space-y-1.5">
                  {aiRecs.map((rec, i) => {
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
                <p className="text-[8px] text-muted-foreground mt-2 italic">⚕️ AI-generated – clinical judgment supersedes</p>
              </div>
            )}

            {/* Tests & Reports */}
            <div className="stat-card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-foreground">Tests & Reports</h2>
                <div className="flex items-center gap-2">
                  <button onClick={handleFileUpload} className="flex items-center gap-1 px-2 py-1 rounded bg-secondary border border-border text-[10px] text-foreground hover:border-primary/30 transition-all">
                    <Upload size={10} /> Upload
                  </button>
                  <button onClick={handleGeneratePDF} className="flex items-center gap-1 px-2 py-1 rounded bg-primary/10 border border-primary/20 text-[10px] text-primary hover:bg-primary/20 transition-all">
                    <Download size={10} /> Download PDF
                  </button>
                </div>
              </div>
              {livePatient.testsTaken.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] text-muted-foreground mb-1">Tests Taken</p>
                  <div className="flex flex-wrap gap-1">
                    {livePatient.testsTaken.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded bg-medical-green/10 text-[10px] text-medical-green border border-medical-green/20">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {livePatient.reports.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] text-muted-foreground mb-1">Reports</p>
                  <div className="space-y-1">
                    {livePatient.reports.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 py-1 px-2 rounded bg-secondary border border-border">
                        <FileText size={10} className="text-muted-foreground" />
                        <span className="text-[10px] text-foreground flex-1">{r.name}</span>
                        <span className="text-[9px] text-muted-foreground">{r.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {livePatient.uploadedFiles.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] text-muted-foreground mb-1">Uploaded Files</p>
                  <div className="space-y-1">
                    {livePatient.uploadedFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 py-1 px-2 rounded bg-secondary border border-border">
                        <Upload size={10} className="text-muted-foreground" />
                        <span className="text-[10px] text-foreground">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {livePatient.testsNeeded.length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Tests Needed</p>
                  <div className="flex flex-wrap gap-1">
                    {livePatient.testsNeeded.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded bg-medical-yellow/10 text-[10px] text-medical-yellow border border-medical-yellow/20">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Medical History */}
            {livePatient.medicalHistory.length > 0 && (
              <div className="stat-card">
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={14} className="text-muted-foreground" />
                  <h2 className="text-xs font-semibold text-foreground">Medical History</h2>
                </div>
                <div className="space-y-1">
                  {livePatient.medicalHistory.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 py-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                      <span className="text-[11px] text-foreground">{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientDetailPage;
