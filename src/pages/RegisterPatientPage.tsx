import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { UserPlus, Printer, CheckCircle, AlertTriangle, X } from "lucide-react";
import { usePatients, Patient } from "@/contexts/PatientContext";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import Barcode from "react-barcode";

const EMERGENCY_SYMPTOMS = ["chest pain", "breathing difficulty", "stroke signs", "heavy bleeding"];

const TRIAGE_FOLLOWUPS: Record<string, string[]> = {
  headache: ["How long have you had the headache?", "Any vomiting?", "Do you have fever?", "Vision problems?", "Neck stiffness?"],
  "chest pain": ["Pain severity (1-10)?", "Does it radiate to the arm or jaw?", "Difficulty breathing?", "Duration?", "Sweating or nausea?"],
  fever: ["How high is the temperature?", "How many days?", "Any chills or rigors?", "Any rash?"],
  "breathing difficulty": ["Sudden or gradual onset?", "Any wheezing?", "Chest tightness?", "History of asthma or COPD?"],
  cough: ["Dry or productive cough?", "Any blood in sputum?", "Duration?", "Associated fever?"],
  "abdominal pain": ["Location of pain?", "Any vomiting or diarrhea?", "Blood in stool?", "Last meal?"],
  dizziness: ["Any fainting episodes?", "Associated with movement?", "Hearing changes?", "Blurred vision?"],
  "heavy bleeding": ["Location of bleeding?", "How long has it been bleeding?", "Any trauma?", "On blood thinners?"],
  "stroke signs": ["Which side is affected?", "Speech difficulty?", "When did symptoms start?", "Any headache?"],
  vomiting: ["How many times?", "Blood in vomit?", "Associated pain?", "Recent food intake?"],
  "back pain": ["Upper or lower back?", "Radiating to legs?", "Any numbness?", "Duration?"],
};

const RegisterPatientPage = () => {
  const { registerPatient, patients } = usePatients();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("M");
  const [registered, setRegistered] = useState<Patient | null>(null);
  const [existingFound, setExistingFound] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const [symptomInput, setSymptomInput] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [triageAnswers, setTriageAnswers] = useState<Record<string, string[]>>({});
  const [currentFollowups, setCurrentFollowups] = useState<{ symptom: string; questions: string[]; answers: string[] } | null>(null);
  const [emergencyAlert, setEmergencyAlert] = useState(false);

  const validatePhone = (value: string) => {
    setPhone(value);
    if (value && !/^\d{10}$/.test(value)) {
      setPhoneError("Invalid phone number. Please enter a valid 10-digit phone number.");
    } else {
      setPhoneError("");
    }
  };

  const handleAddSymptom = () => {
    const s = symptomInput.trim().toLowerCase();
    if (!s || symptoms.includes(s)) return;
    setSymptoms(prev => [...prev, s]);
    setSymptomInput("");

    if (EMERGENCY_SYMPTOMS.some(e => s.includes(e))) {
      setEmergencyAlert(true);
    }

    const key = Object.keys(TRIAGE_FOLLOWUPS).find(k => s.includes(k));
    if (key) {
      setCurrentFollowups({ symptom: s, questions: TRIAGE_FOLLOWUPS[key], answers: new Array(TRIAGE_FOLLOWUPS[key].length).fill("") });
    }
  };

  const handleRemoveSymptom = (idx: number) => {
    const removed = symptoms[idx];
    setSymptoms(prev => prev.filter((_, i) => i !== idx));
    // Remove triage answers for this symptom
    setTriageAnswers(prev => {
      const next = { ...prev };
      delete next[removed];
      return next;
    });
    // Check if emergency still applies
    const remaining = symptoms.filter((_, i) => i !== idx);
    if (!remaining.some(s => EMERGENCY_SYMPTOMS.some(e => s.includes(e)))) {
      setEmergencyAlert(false);
    }
  };

  const handleFollowupAnswer = (idx: number, value: string) => {
    if (!currentFollowups) return;
    const newAnswers = [...currentFollowups.answers];
    newAnswers[idx] = value;
    setCurrentFollowups({ ...currentFollowups, answers: newAnswers });
  };

  const handleSaveFollowups = () => {
    if (!currentFollowups) return;
    setTriageAnswers(prev => ({ ...prev, [currentFollowups.symptom]: currentFollowups.answers }));
    setCurrentFollowups(null);
  };

  const handleRegister = async () => {
    if (!name.trim() || !age || !phone.trim()) return;
    if (!/^\d{10}$/.test(phone)) {
      setPhoneError("Invalid phone number. Please enter a valid 10-digit phone number.");
      return;
    }
    const existing = patients.find(p => p.phone === phone);
    if (existing) {
      setRegistered(existing);
      setExistingFound(true);
      return;
    }
    const patient = await registerPatient(name.trim(), parseInt(age), phone.trim(), gender);
    if (patient) {
      // Save symptoms to triage if any
      if (symptoms.length > 0) {
        await supabase.from("triage").update({ symptoms }).eq("patient_id", patient.dbId);
      }
      // Save triage followup answers as additional info in timeline
      if (Object.keys(triageAnswers).length > 0) {
        const desc = Object.entries(triageAnswers).map(([s, answers]) => {
          const key = Object.keys(TRIAGE_FOLLOWUPS).find(k => s.includes(k));
          const qs = key ? TRIAGE_FOLLOWUPS[key] : [];
          return `${s}: ${qs.map((q, i) => answers[i] ? `${q} ${answers[i]}` : "").filter(Boolean).join("; ")}`;
        }).join(" | ");
        await supabase.from("patient_timeline").insert({ patient_id: patient.dbId, event_description: `Triage responses: ${desc}`, event_type: "triage" });
      }
      setRegistered(patient);
      setExistingFound(false);
    }
  };

  const handlePrint = () => {
    if (!registered) return;
    const w = window.open("", "_blank", "width=400,height=300");
    if (!w) return;
    w.document.write(`
      <html><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:monospace;">
        <h2>${registered.name}</h2>
        <p>ID: ${registered.id}</p>
        <p style="font-size:24px;letter-spacing:4px;font-weight:bold;margin-top:8px">${registered.barcode}</p>
        <p>Age: ${registered.age} | Phone: ${registered.phone}</p>
        <script>window.print();<\/script>
      </body></html>
    `);
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-up max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <UserPlus size={18} className="text-primary" />
          <h1 className="text-lg font-bold text-foreground">{t("register.title")}</h1>
        </div>

        <div className="stat-card space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">{t("register.fullName")}</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                placeholder={t("register.patientName")} />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">{t("register.phoneNumber")}</label>
              <input value={phone} onChange={e => validatePhone(e.target.value)}
                className={`w-full bg-secondary border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-all ${phoneError ? "border-primary focus:border-primary focus:ring-primary/30" : "border-border focus:border-primary/50 focus:ring-primary/30"}`}
                placeholder={t("register.digitPhone")} maxLength={10} />
              {phoneError && (
                <p className="text-[10px] text-primary mt-1 flex items-center gap-1"><AlertTriangle size={10} /> {phoneError}</p>
              )}
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">{t("register.age")}</label>
              <input type="number" value={age} onChange={e => setAge(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                placeholder={t("register.age")} min={0} max={150} />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">{t("register.gender")}</label>
              <select value={gender} onChange={e => setGender(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all">
                <option value="M">{t("register.male")}</option>
                <option value="F">{t("register.female")}</option>
                <option value="O">{t("register.other")}</option>
              </select>
            </div>
          </div>

          {/* Symptom Input */}
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Symptoms</label>
            <div className="flex gap-2">
              <input value={symptomInput} onChange={e => setSymptomInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddSymptom()}
                className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                placeholder="Enter symptom (e.g., Headache, Chest pain...)" />
              <button onClick={handleAddSymptom} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">Add</button>
            </div>
            {symptoms.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {symptoms.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] border border-primary/20 flex items-center gap-1">
                    {s}
                    <button onClick={() => handleRemoveSymptom(i)} className="hover:text-foreground"><X size={8} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Emergency Alert */}
          {emergencyAlert && (
            <div className="p-3 rounded-lg bg-primary/15 border-2 border-primary glow-red-border critical-flash">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-primary" />
                <div>
                  <p className="text-sm font-bold text-primary">⚠️ EMERGENCY WARNING</p>
                  <p className="text-xs font-semibold text-primary">CALL EMERGENCY SERVICES IMMEDIATELY</p>
                  <p className="text-[10px] text-primary/80 mt-1">Critical symptom detected. Immediate medical attention required.</p>
                </div>
              </div>
            </div>
          )}

          {/* Triage Follow-up Questions */}
          {currentFollowups && (
            <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
              <p className="text-xs font-semibold text-foreground">Triage Questions for: <span className="text-primary capitalize">{currentFollowups.symptom}</span></p>
              {currentFollowups.questions.map((q, i) => (
                <div key={i}>
                  <label className="text-[10px] text-muted-foreground block mb-1">{q}</label>
                  <input value={currentFollowups.answers[i]} onChange={e => handleFollowupAnswer(i, e.target.value)}
                    className="w-full bg-card border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary/50 transition-all" placeholder="Enter answer..." />
                </div>
              ))}
              <button onClick={handleSaveFollowups} className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">Save Answers</button>
            </div>
          )}

          {/* Saved triage answers */}
          {Object.keys(triageAnswers).length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Triage Responses</p>
              {Object.entries(triageAnswers).map(([symptom, answers]) => {
                const questions = Object.keys(TRIAGE_FOLLOWUPS).find(k => symptom.includes(k));
                const qs = questions ? TRIAGE_FOLLOWUPS[questions] : [];
                return (
                  <div key={symptom} className="p-2 rounded bg-secondary border border-border">
                    <p className="text-[10px] text-primary font-semibold capitalize mb-1">{symptom}</p>
                    {qs.map((q, i) => answers[i] && (
                      <p key={i} className="text-[10px] text-muted-foreground"><span className="text-foreground">{q}</span> — {answers[i]}</p>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* Medical Disclaimer */}
          <div className="p-2.5 rounded-lg bg-muted/50 border border-border">
            <p className="text-[10px] font-semibold text-muted-foreground">⚕️ Medical Disclaimer</p>
            <p className="text-[9px] text-muted-foreground leading-relaxed">This system provides informational triage guidance only. It is not a substitute for professional medical advice.</p>
          </div>

          <button onClick={handleRegister}
            disabled={!name.trim() || !age || !phone.trim() || !!phoneError}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <UserPlus size={14} /> {t("register.registerButton")}
          </button>
        </div>

        {registered && (
          <div className="stat-card mt-4 animate-fade-up">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={14} className="text-medical-green" />
              <span className="text-xs font-semibold text-medical-green">
                {existingFound ? t("register.alreadyRegistered") : t("register.registeredSuccess")}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
              <div><span className="text-muted-foreground">{t("common.id")}:</span> <span className="text-foreground font-semibold">{registered.id}</span></div>
              <div><span className="text-muted-foreground">{t("common.name")}:</span> <span className="text-foreground font-semibold">{registered.name}</span></div>
              <div><span className="text-muted-foreground">{t("register.age")}:</span> <span className="text-foreground">{registered.age}</span></div>
              <div><span className="text-muted-foreground">{t("detail.phone")}:</span> <span className="text-foreground">{registered.phone}</span></div>
            </div>
            <div className="p-4 bg-secondary rounded-lg border border-border flex flex-col items-center gap-2 mb-4">
              <Barcode size={20} className="text-muted-foreground" />
              <div className="flex gap-[2px]">
                {registered.barcode.split("").map((c, i) => (
                  <div key={i} className="bg-foreground" style={{ width: parseInt(c) % 2 === 0 ? 2 : 3, height: 40 }} />
                ))}
              </div>
              <p className="text-xs font-mono text-muted-foreground tracking-[4px]">{registered.barcode}</p>
            </div>
            {existingFound && registered.medicalHistory.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">{t("register.medicalHistory")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {registered.medicalHistory.map((h, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] border border-primary/20">{h}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={handlePrint} className="flex-1 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground hover:border-primary/30 transition-all flex items-center justify-center gap-1.5">
                <Printer size={12} /> {t("register.printBarcode")}
              </button>
              <button onClick={() => navigate(`/patients/${registered.id}`)} className="flex-1 py-2 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary hover:bg-primary/20 transition-all flex items-center justify-center gap-1.5">
                {t("register.viewProfile")}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RegisterPatientPage;
