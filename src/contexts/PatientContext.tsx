import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

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

export interface PatientReport {
  name: string;
  date: string;
  type: "lab" | "imaging" | "uploaded";
}

export interface Patient {
  id: string;
  dbId: string; // UUID from database
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
  admissionDate: string;
  symptoms: string[];
  testsTaken: string[];
  testsNeeded: string[];
  reports: PatientReport[];
  medicalHistory: string[];
  barcode: string;
  uploadedFiles: string[];
}

// ─── Severity Classification ─────────────────────────────────────────
type Severity = "Critical" | "High" | "Moderate" | "Stable";

const classifyVitalSeverity = (v: PatientVitals): Severity => {
  if (v.hr < 40 || v.hr > 130) return "Critical";
  if (v.bpSys < 80 || v.bpSys > 180) return "Critical";
  if (v.spo2 < 90) return "Critical";
  if (v.temp < 35 || v.temp > 39.5) return "Critical";

  if ((v.hr >= 40 && v.hr <= 49) || (v.hr >= 111 && v.hr <= 130)) return "High";
  if ((v.bpSys >= 80 && v.bpSys <= 89) || (v.bpSys >= 161 && v.bpSys <= 180)) return "High";
  if (v.spo2 >= 90 && v.spo2 <= 92) return "High";
  if (v.temp >= 38.5 && v.temp <= 39.5) return "High";

  const hrMod = v.hr >= 91 && v.hr <= 110;
  const spo2Mod = v.spo2 >= 93 && v.spo2 <= 95;
  const tempMod = v.temp >= 37.5 && v.temp <= 38.4;
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
    gain.gain.setValueAtTime(0.08, criticalAudioCtx.currentTime);
    for (let i = 0; i < 4; i++) {
      gain.gain.setValueAtTime(0.08, criticalAudioCtx.currentTime + i * 0.3);
      gain.gain.setValueAtTime(0, criticalAudioCtx.currentTime + i * 0.3 + 0.15);
    }
    osc.connect(gain).connect(criticalAudioCtx.destination);
    osc.start();
    osc.stop(criticalAudioCtx.currentTime + 1.2);
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
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.06, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0, ctx.currentTime + 0.45);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {}
};

export const playPatientClickSound = (level: Severity) => {
  if (level !== "Critical" && level !== "High") return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(level === "Critical" ? 520 : 440, ctx.currentTime);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch {}
};

// ─── Context ─────────────────────────────────────────────────────────
interface PatientContextType {
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  registerPatient: (name: string, age: number, phone: string, gender: string) => Promise<Patient | null>;
  updateDiagnosis: (id: string, diagnosis: string) => Promise<void>;
  addManualVitals: (id: string, vitals: PatientVitals, recordedBy: string) => Promise<void>;
  addUploadedFile: (id: string, fileName: string) => void;
  getPatient: (id: string) => Patient | undefined;
  classifyVitals: (v: PatientVitals) => Severity;
  statusChangeMessages: Record<string, string>;
  loading: boolean;
  refreshPatients: () => Promise<void>;
}

const PatientContext = createContext<PatientContextType>({
  patients: [],
  setPatients: () => {},
  registerPatient: async () => null,
  updateDiagnosis: async () => {},
  addManualVitals: async () => {},
  addUploadedFile: () => {},
  getPatient: () => undefined,
  classifyVitals: () => "Stable",
  statusChangeMessages: {},
  loading: true,
  refreshPatients: async () => {},
});

// Helper to map DB rows to Patient interface
const mapDbToPatient = (
  p: any,
  vitals: any,
  triage: any,
  reports: any[],
  vitalHistory: any[]
): Patient => {
  const latestVitals: PatientVitals = vitals
    ? { hr: vitals.heart_rate, bpSys: vitals.blood_pressure_sys, bpDia: vitals.blood_pressure_dia, spo2: vitals.spo2, temp: Number(vitals.temperature) }
    : { hr: 72, bpSys: 120, bpDia: 80, spo2: 98, temp: 36.8 };

  const riskLevel = (triage?.risk_level as Severity) || classifyVitalSeverity(latestVitals);

  return {
    id: p.patient_code,
    dbId: p.id,
    name: p.name,
    age: p.age,
    gender: p.gender,
    phone: p.phone,
    connected: riskLevel === "Critical" || riskLevel === "High",
    vitals: latestVitals,
    manualVitals: vitalHistory.map((v: any) => ({
      vitals: { hr: v.heart_rate, bpSys: v.blood_pressure_sys, bpDia: v.blood_pressure_dia, spo2: v.spo2, temp: Number(v.temperature) },
      recordedAt: new Date(v.recorded_at).toLocaleString(),
      recordedBy: v.recorded_by || "System",
    })),
    riskLevel,
    complications: triage?.complications || [],
    oxygenDropRisk: triage?.oxygen_drop_risk || 0,
    cardiacRisk: triage?.cardiac_risk || 0,
    diagnosis: p.diagnosis || "",
    admissionDate: p.admission_date,
    symptoms: triage?.symptoms || [],
    testsTaken: triage?.tests_taken || [],
    testsNeeded: triage?.tests_needed || [],
    reports: reports.map((r: any) => ({ name: r.file_name, date: r.created_at?.split("T")[0] || "", type: r.report_type as "lab" | "imaging" | "uploaded" })),
    medicalHistory: triage?.medical_history || [],
    barcode: p.barcode,
    uploadedFiles: reports.filter((r: any) => r.report_type === "uploaded").map((r: any) => r.file_name),
  };
};

export const PatientProvider = ({ children }: { children: ReactNode }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [prevRiskLevels, setPrevRiskLevels] = useState<Record<string, Severity>>({});
  const [statusChangeMessages, setStatusChangeMessages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchAllPatients = useCallback(async () => {
    if (!user) { setPatients([]); setLoading(false); return; }
    
    const { data: patientsData } = await supabase.from("patients").select("*").order("created_at", { ascending: false });
    if (!patientsData || patientsData.length === 0) { setPatients([]); setLoading(false); return; }

    const patientIds = patientsData.map(p => p.id);

    const [vitalsRes, triageRes, reportsRes] = await Promise.all([
      supabase.from("vitals").select("*").in("patient_id", patientIds).order("recorded_at", { ascending: false }),
      supabase.from("triage").select("*").in("patient_id", patientIds),
      supabase.from("patient_reports").select("*").in("patient_id", patientIds),
    ]);

    const vitalsMap: Record<string, any> = {};
    const vitalsHistoryMap: Record<string, any[]> = {};
    (vitalsRes.data || []).forEach(v => {
      if (!vitalsMap[v.patient_id]) vitalsMap[v.patient_id] = v;
      if (!vitalsHistoryMap[v.patient_id]) vitalsHistoryMap[v.patient_id] = [];
      vitalsHistoryMap[v.patient_id].push(v);
    });

    const triageMap: Record<string, any> = {};
    (triageRes.data || []).forEach(t => { triageMap[t.patient_id] = t; });

    const reportsMap: Record<string, any[]> = {};
    (reportsRes.data || []).forEach(r => {
      if (!reportsMap[r.patient_id]) reportsMap[r.patient_id] = [];
      reportsMap[r.patient_id].push(r);
    });

    const mapped = patientsData.map(p =>
      mapDbToPatient(p, vitalsMap[p.id], triageMap[p.id], reportsMap[p.id] || [], vitalsHistoryMap[p.id] || [])
    );

    setPatients(mapped);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAllPatients(); }, [fetchAllPatients]);

  // Realtime subscriptions + polling fallback
  useEffect(() => {
    if (!user) return;

    // Subscribe to realtime changes
    const channel = supabase
      .channel("patient_data_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "patients" }, () => fetchAllPatients())
      .on("postgres_changes", { event: "*", schema: "public", table: "vitals" }, () => fetchAllPatients())
      .on("postgres_changes", { event: "*", schema: "public", table: "triage" }, () => fetchAllPatients())
      .subscribe();

    // Polling fallback every 10 seconds
    const interval = setInterval(fetchAllPatients, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user, fetchAllPatients]);

  // Detect status changes and trigger alerts
  useEffect(() => {
    const newMessages: Record<string, string> = {};
    patients.forEach(p => {
      const prev = prevRiskLevels[p.id];
      if (prev && (prev === "Stable" || prev === "Moderate") && (p.riskLevel === "Critical" || p.riskLevel === "High")) {
        playCriticalAlert();
        newMessages[p.id] = `⚠️ ${p.name} needs to be connected to a vital sign monitor`;
      }
      if (prev && prev !== "Critical" && p.riskLevel === "Critical") {
        playCriticalAlert();
      } else if (prev && prev !== "High" && prev !== "Critical" && p.riskLevel === "High") {
        playHighRiskAlert();
      }
    });
    if (Object.keys(newMessages).length > 0) {
      setStatusChangeMessages(prev => ({ ...prev, ...newMessages }));
      setTimeout(() => {
        setStatusChangeMessages(prev => {
          const next = { ...prev };
          Object.keys(newMessages).forEach(k => delete next[k]);
          return next;
        });
      }, 8000);
    }
    const levels: Record<string, Severity> = {};
    patients.forEach(p => { levels[p.id] = p.riskLevel; });
    setPrevRiskLevels(levels);
  }, [patients]);

  const registerPatient = useCallback(async (name: string, age: number, phone: string, gender: string): Promise<Patient | null> => {
    if (!user) return null;

    // Check for existing patient by phone
    const { data: existing } = await supabase.from("patients").select("patient_code").eq("phone", phone).maybeSingle();
    if (existing) {
      const found = patients.find(p => p.id === existing.patient_code);
      return found || null;
    }

    // Auto-assign doctor and nurse using load balancing
    let assignedDoctorId: string | null = null;
    let assignedNurseId: string | null = null;
    try {
      // Get all doctors and nurses
      const { data: allRoles } = await supabase.from("user_roles").select("user_id, role");
      const doctorIds = (allRoles || []).filter(r => r.role === "doctor").map(r => r.user_id);
      const nurseIds = (allRoles || []).filter(r => r.role === "nurse").map(r => r.user_id);

      if (doctorIds.length > 0) {
        // Count current patient assignments per doctor
        const { data: allPatients } = await supabase.from("patients").select("assigned_doctor_id, assigned_nurse_id");
        const doctorCounts: Record<string, number> = {};
        const nurseCounts: Record<string, number> = {};
        doctorIds.forEach(id => { doctorCounts[id] = 0; });
        nurseIds.forEach(id => { nurseCounts[id] = 0; });
        (allPatients || []).forEach(p => {
          if (p.assigned_doctor_id && doctorCounts[p.assigned_doctor_id] !== undefined) doctorCounts[p.assigned_doctor_id]++;
          if (p.assigned_nurse_id && nurseCounts[p.assigned_nurse_id] !== undefined) nurseCounts[p.assigned_nurse_id]++;
        });

        // Pick doctor with lowest count
        assignedDoctorId = doctorIds.reduce((min, id) => (doctorCounts[id] < doctorCounts[min] ? id : min), doctorIds[0]);
        // Pick nurse with lowest count
        if (nurseIds.length > 0) {
          assignedNurseId = nurseIds.reduce((min, id) => (nurseCounts[id] < nurseCounts[min] ? id : min), nurseIds[0]);
        }
      }
    } catch {}

    const barcode = "MED" + Math.floor(Math.random() * 10000000000).toString().padStart(10, "0");
    const patientCode = "PT-" + Math.floor(Math.random() * 900 + 100).toString();

    const { data: newPatient, error } = await supabase.from("patients").insert({
      patient_code: patientCode,
      name, age, gender, phone, barcode,
      created_by: user.id,
      assigned_doctor_id: assignedDoctorId,
      assigned_nurse_id: assignedNurseId,
    }).select().single();

    if (error || !newPatient) return null;

    // Create initial vitals and triage entries
    await Promise.all([
      supabase.from("vitals").insert({ patient_id: newPatient.id, recorded_by: user.id }),
      supabase.from("triage").insert({ patient_id: newPatient.id }),
    ]);

    await fetchAllPatients();
    return patients.find(p => p.dbId === newPatient.id) || {
      id: newPatient.patient_code, dbId: newPatient.id, name, age, gender, phone,
      connected: false, vitals: { hr: 72, bpSys: 120, bpDia: 80, spo2: 98, temp: 36.8 },
      manualVitals: [], riskLevel: "Stable", complications: [], oxygenDropRisk: 0, cardiacRisk: 0,
      diagnosis: "", admissionDate: newPatient.admission_date, symptoms: [], testsTaken: [],
      testsNeeded: [], reports: [], medicalHistory: [], barcode: newPatient.barcode, uploadedFiles: [],
    };
  }, [user, patients, fetchAllPatients]);

  const updateDiagnosis = useCallback(async (id: string, diagnosis: string) => {
    const patient = patients.find(p => p.id === id);
    if (!patient) return;
    await supabase.from("patients").update({ diagnosis }).eq("id", patient.dbId);
    await fetchAllPatients();
  }, [patients, fetchAllPatients]);

  const addManualVitals = useCallback(async (id: string, vitals: PatientVitals, recordedBy: string) => {
    const patient = patients.find(p => p.id === id);
    if (!patient || !user) return;
    await supabase.from("vitals").insert({
      patient_id: patient.dbId,
      heart_rate: vitals.hr,
      blood_pressure_sys: vitals.bpSys,
      blood_pressure_dia: vitals.bpDia,
      spo2: vitals.spo2,
      temperature: vitals.temp,
      recorded_by: user.id,
    });
    await fetchAllPatients();
  }, [patients, user, fetchAllPatients]);

  const addUploadedFile = useCallback((id: string, fileName: string) => {
    const patient = patients.find(p => p.id === id);
    if (!patient) return;
    supabase.from("patient_reports").insert({
      patient_id: patient.dbId,
      file_name: fileName,
      report_type: "uploaded",
    }).then(() => fetchAllPatients());
  }, [patients, fetchAllPatients]);

  const getPatient = useCallback((id: string) => patients.find(p => p.id === id), [patients]);

  return (
    <PatientContext.Provider value={{
      patients, setPatients, registerPatient, updateDiagnosis, addManualVitals,
      addUploadedFile, getPatient, classifyVitals: classifyVitalSeverity,
      statusChangeMessages, loading, refreshPatients: fetchAllPatients,
    }}>
      {children}
    </PatientContext.Provider>
  );
};

export const usePatients = () => useContext(PatientContext);
