import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { UserPlus, Barcode, Printer, CheckCircle } from "lucide-react";
import { usePatients, Patient } from "@/contexts/PatientContext";
import { useNavigate } from "react-router-dom";

const RegisterPatientPage = () => {
  const { registerPatient, patients } = usePatients();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("M");
  const [registered, setRegistered] = useState<Patient | null>(null);
  const [existingFound, setExistingFound] = useState(false);

  const handleRegister = () => {
    if (!name.trim() || !age || !phone.trim()) return;
    const existing = patients.find(p => p.phone === phone);
    if (existing) {
      setRegistered(existing);
      setExistingFound(true);
      return;
    }
    const patient = registerPatient(name.trim(), parseInt(age), phone.trim(), gender);
    setRegistered(patient);
    setExistingFound(false);
  };

  const handlePrint = () => {
    if (!registered) return;
    const w = window.open("", "_blank", "width=400,height=300");
    if (!w) return;
    w.document.write(`
      <html><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:monospace;">
        <h2>${registered.name}</h2>
        <p>ID: ${registered.id}</p>
        <svg id="bc"></svg>
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
          <h1 className="text-lg font-bold text-foreground">Register Patient</h1>
        </div>

        <div className="stat-card space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Full Name *</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                placeholder="Patient name"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Phone Number *</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                placeholder="10-digit phone"
                maxLength={10}
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Age *</label>
              <input
                type="number"
                value={age}
                onChange={e => setAge(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                placeholder="Age"
                min={0}
                max={150}
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Gender</label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleRegister}
            disabled={!name.trim() || !age || !phone.trim()}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <UserPlus size={14} /> Register Patient
          </button>
        </div>

        {registered && (
          <div className="stat-card mt-4 animate-fade-up">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={14} className="text-medical-green" />
              <span className="text-xs font-semibold text-medical-green">
                {existingFound ? "Patient Already Registered – Medical History Available" : "Patient Registered Successfully"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
              <div><span className="text-muted-foreground">ID:</span> <span className="text-foreground font-semibold">{registered.id}</span></div>
              <div><span className="text-muted-foreground">Name:</span> <span className="text-foreground font-semibold">{registered.name}</span></div>
              <div><span className="text-muted-foreground">Age:</span> <span className="text-foreground">{registered.age}</span></div>
              <div><span className="text-muted-foreground">Phone:</span> <span className="text-foreground">{registered.phone}</span></div>
            </div>

            {/* Barcode Display */}
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
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Medical History</p>
                <div className="flex flex-wrap gap-1.5">
                  {registered.medicalHistory.map((h, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] border border-primary/20">{h}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={handlePrint} className="flex-1 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground hover:border-primary/30 transition-all flex items-center justify-center gap-1.5">
                <Printer size={12} /> Print Barcode
              </button>
              <button onClick={() => navigate(`/patients/${registered.id}`)} className="flex-1 py-2 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary hover:bg-primary/20 transition-all flex items-center justify-center gap-1.5">
                View Profile →
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RegisterPatientPage;
