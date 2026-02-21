import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface PatientVitals {
  hr: number;
  bpSys: number;
  bpDia: number;
  spo2: number;
  temp: number;
}

export interface ManualVitalEntry {
  vitals: PatientVitals;
  recordedAt: string;
  recordedBy: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  connected: boolean;
  vitals: PatientVitals;
  manualVitals: ManualVitalEntry[];
  riskLevel: "Critical" | "High" | "Moderate" | "Stable";
  complications: string[];
  oxygenDropRisk: number;
  cardiacRisk: number;
  diagnosis: string;
  doctorSuggestions: string;
  admissionDate: string;
  symptoms: string[];
  testsTaken: string[];
  testsNeeded: string[];
  reports: string[];
  medicalHistory: string[];
  barcode: string;
}

// ─── Severity Classification ─────────────────────────────────────────
type Severity = "Critical" | "High" | "Moderate" | "Stable";

const classifyVitalSeverity = (v: PatientVitals): Severity => {
  // CRITICAL – any ONE
  if (v.hr < 40 || v.hr > 130) return "Critical";
  if (v.bpSys < 80 || v.bpSys > 180) return "Critical";
  if (v.spo2 < 90) return "Critical";
  if (v.temp < 35 || v.temp > 39.5) return "Critical";

  // HIGH RISK – any ONE
  if ((v.hr >= 40 && v.hr <= 49) || (v.hr >= 111 && v.hr <= 130)) return "High";
  if ((v.bpSys >= 80 && v.bpSys <= 89) || (v.bpSys >= 161 && v.bpSys <= 180)) return "High";
  if (v.spo2 >= 90 && v.spo2 <= 92) return "High";
  if (v.temp >= 38.5 && v.temp <= 39.5) return "High";

  // MODERATE – all in range
  const hrMod = v.hr >= 91 && v.hr <= 110;
  const bpMod = v.bpSys >= 90 && v.bpSys <= 160;
  const spo2Mod = v.spo2 >= 93 && v.spo2 <= 95;
  const tempMod = v.temp >= 37.5 && v.temp <= 38.4;
  if (hrMod && bpMod && spo2Mod && tempMod) return "Moderate";

  // If any single vital is moderate-range but others are stable, check individually
  if (hrMod || spo2Mod || tempMod) return "Moderate";

  return "Stable";
};

export const shouldShowLiveVitals = (level: Severity) => level === "Critical" || level === "High";

// ─── Sound Alerts ────────────────────────────────────────────────────
let criticalAudioCtx: AudioContext | null = null;
let criticalOscillator: OscillatorNode | null = null;

export const playCriticalAlert = () => {
  try {
    if (!criticalAudioCtx) criticalAudioCtx = new AudioContext();
    if (criticalOscillator) { try { criticalOscillator.stop(); } catch {} }
    const osc = criticalAudioCtx.createOscillator();
    const gain = criticalAudioCtx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(880, criticalAudioCtx.currentTime);
    gain.gain.setValueAtTime(0.15, criticalAudioCtx.currentTime);
    // Pulse pattern
    for (let i = 0; i < 6; i++) {
      gain.gain.setValueAtTime(0.15, criticalAudioCtx.currentTime + i * 0.3);
      gain.gain.setValueAtTime(0, criticalAudioCtx.currentTime + i * 0.3 + 0.15);
    }
    osc.connect(gain).connect(criticalAudioCtx.destination);
    osc.start();
    osc.stop(criticalAudioCtx.currentTime + 1.8);
    criticalOscillator = osc;
  } catch {}
};

export const playHighRiskAlert = () => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.1, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0, ctx.currentTime + 0.6);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch {}
};

// ─── Helpers ─────────────────────────────────────────────────────────
const generateVital = (base: number, range: number) => Math.round(base + (Math.random() - 0.5) * range);
const generateBarcode = () => {
  const chars = "0123456789";
  let code = "MED";
  for (let i = 0; i < 10; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

let nextId = 6;
const generateId = () => `PT-${String(nextId++).padStart(3, "0")}`;

// ─── Initial Data ────────────────────────────────────────────────────
const initialPatients: Patient[] = [
  { id: "PT-001", name: "Rajesh Kumar", age: 62, gender: "M", phone: "9876543210", connected: true, vitals: { hr: 112, bpSys: 155, bpDia: 98, spo2: 91, temp: 38.8 }, manualVitals: [], riskLevel: "Critical", complications: ["Cardiac Arrest Risk", "Hypoxemia"], oxygenDropRisk: 78, cardiacRisk: 65, diagnosis: "", doctorSuggestions: "", admissionDate: "2026-02-18", symptoms: ["Chest Pain", "Dyspnea"], testsTaken: ["ECG", "Troponin"], testsNeeded: ["Angiography"], reports: [], medicalHistory: ["Hypertension", "Previous MI 2024"], barcode: "MED0010000001" },
  { id: "PT-002", name: "Priya Sharma", age: 45, gender: "F", phone: "9876543211", connected: true, vitals: { hr: 88, bpSys: 130, bpDia: 85, spo2: 95, temp: 37.6 }, manualVitals: [], riskLevel: "Moderate", complications: ["Mild Hypertension"], oxygenDropRisk: 22, cardiacRisk: 15, diagnosis: "", doctorSuggestions: "", admissionDate: "2026-02-19", symptoms: ["Headache", "Nausea"], testsTaken: ["CBC"], testsNeeded: ["MRI Brain"], reports: [], medicalHistory: [], barcode: "MED0020000002" },
  { id: "PT-003", name: "Amit Patel", age: 71, gender: "M", phone: "9876543212", connected: true, vitals: { hr: 125, bpSys: 170, bpDia: 105, spo2: 88, temp: 39.2 }, manualVitals: [], riskLevel: "Critical", complications: ["Sepsis Suspected", "Respiratory Failure"], oxygenDropRisk: 89, cardiacRisk: 72, diagnosis: "", doctorSuggestions: "", admissionDate: "2026-02-17", symptoms: ["High Fever", "Confusion", "Tachycardia"], testsTaken: ["Blood Culture", "ABG"], testsNeeded: ["CT Chest"], reports: [], medicalHistory: ["COPD", "Diabetes Type 2"], barcode: "MED0030000003" },
  { id: "PT-004", name: "Sunita Devi", age: 34, gender: "F", phone: "9876543213", connected: false, vitals: { hr: 76, bpSys: 118, bpDia: 76, spo2: 98, temp: 36.9 }, manualVitals: [], riskLevel: "Stable", complications: [], oxygenDropRisk: 5, cardiacRisk: 3, diagnosis: "", doctorSuggestions: "", admissionDate: "2026-02-20", symptoms: ["Mild Cough"], testsTaken: [], testsNeeded: ["Chest X-Ray"], reports: [], medicalHistory: [], barcode: "MED0040000004" },
  { id: "PT-005", name: "Mohammed Iqbal", age: 58, gender: "M", phone: "9876543214", connected: false, vitals: { hr: 98, bpSys: 142, bpDia: 92, spo2: 93, temp: 38.1 }, manualVitals: [], riskLevel: "High", complications: ["Diabetic Emergency"], oxygenDropRisk: 45, cardiacRisk: 38, diagnosis: "", doctorSuggestions: "", admissionDate: "2026-02-19", symptoms: ["Polyuria", "Fatigue", "Blurred Vision"], testsTaken: ["Blood Glucose", "HbA1c"], testsNeeded: ["BMP", "ABG"], reports: [], medicalHistory: ["Type 2 Diabetes", "Retinopathy"], barcode: "MED0050000005" },
];

// ─── Context ─────────────────────────────────────────────────────────
interface PatientContextType {
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  registerPatient: (name: string, age: number, phone: string, gender: string) => Patient;
  updateDiagnosis: (id: string, diagnosis: string) => void;
  updateSuggestions: (id: string, suggestions: string) => void;
  addManualVitals: (id: string, vitals: PatientVitals, recordedBy: string) => void;
  getPatient: (id: string) => Patient | undefined;
  classifyVitals: (v: PatientVitals) => Severity;
}

const PatientContext = createContext<PatientContextType>({
  patients: [],
  setPatients: () => {},
  registerPatient: () => initialPatients[0],
  updateDiagnosis: () => {},
  updateSuggestions: () => {},
  addManualVitals: () => {},
  getPatient: () => undefined,
  classifyVitals: () => "Stable",
});

export const PatientProvider = ({ children }: { children: ReactNode }) => {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);

  const registerPatient = useCallback((name: string, age: number, phone: string, gender: string): Patient => {
    // Check if already registered by phone
    const existing = patients.find(p => p.phone === phone);
    if (existing) return existing;

    const newPatient: Patient = {
      id: generateId(),
      name, age, gender, phone,
      connected: false,
      vitals: { hr: 72, bpSys: 120, bpDia: 80, spo2: 98, temp: 36.8 },
      manualVitals: [],
      riskLevel: "Stable",
      complications: [],
      oxygenDropRisk: 2,
      cardiacRisk: 1,
      diagnosis: "",
      doctorSuggestions: "",
      admissionDate: new Date().toISOString().split("T")[0],
      symptoms: [],
      testsTaken: [],
      testsNeeded: [],
      reports: [],
      medicalHistory: [],
      barcode: generateBarcode(),
    };
    setPatients(prev => [...prev, newPatient]);
    return newPatient;
  }, [patients]);

  const updateDiagnosis = useCallback((id: string, diagnosis: string) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, diagnosis } : p));
  }, []);

  const updateSuggestions = useCallback((id: string, suggestions: string) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, doctorSuggestions: suggestions } : p));
  }, []);

  const addManualVitals = useCallback((id: string, vitals: PatientVitals, recordedBy: string) => {
    setPatients(prev => prev.map(p => {
      if (p.id !== id) return p;
      const entry: ManualVitalEntry = { vitals, recordedAt: new Date().toLocaleString(), recordedBy };
      const newRisk = classifyVitalSeverity(vitals);
      return { ...p, vitals, manualVitals: [...p.manualVitals, entry], riskLevel: newRisk };
    }));
  }, []);

  const getPatient = useCallback((id: string) => patients.find(p => p.id === id), [patients]);

  // Simulate live vitals for connected Critical/High patients
  useEffect(() => {
    const interval = setInterval(() => {
      setPatients(prev => prev.map(p => {
        if (!p.connected || !shouldShowLiveVitals(p.riskLevel)) return p;
        const newVitals: PatientVitals = {
          hr: generateVital(p.vitals.hr, 8),
          bpSys: generateVital(p.vitals.bpSys, 6),
          bpDia: generateVital(p.vitals.bpDia, 4),
          spo2: Math.min(100, Math.max(80, generateVital(p.vitals.spo2, 3))),
          temp: Math.round((p.vitals.temp + (Math.random() - 0.5) * 0.3) * 10) / 10,
        };
        const newRisk = classifyVitalSeverity(newVitals);
        const prevRisk = p.riskLevel;

        if (newRisk === "Critical" && prevRisk !== "Critical") {
          playCriticalAlert();
        } else if (newRisk === "High" && prevRisk !== "High" && prevRisk !== "Critical") {
          playHighRiskAlert();
        }

        return {
          ...p,
          vitals: newVitals,
          riskLevel: newRisk,
          oxygenDropRisk: Math.min(99, Math.max(5, generateVital(p.oxygenDropRisk, 5))),
          cardiacRisk: Math.min(99, Math.max(3, generateVital(p.cardiacRisk, 4))),
        };
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <PatientContext.Provider value={{ patients, setPatients, registerPatient, updateDiagnosis, updateSuggestions, addManualVitals, getPatient, classifyVitals: classifyVitalSeverity }}>
      {children}
    </PatientContext.Provider>
  );
};

export const usePatients = () => useContext(PatientContext);
