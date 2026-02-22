import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Search, Users, ChevronRight, Wifi, WifiOff, Barcode, MonitorSmartphone } from "lucide-react";
import { usePatients, shouldShowLiveVitals, playPatientClickSound } from "@/contexts/PatientContext";
import { useNavigate } from "react-router-dom";

const riskColors: Record<string, string> = {
  Critical: "bg-primary/20 text-primary border-primary/40",
  High: "bg-medical-yellow/20 text-medical-yellow border-medical-yellow/40",
  Moderate: "bg-medical-blue/20 text-medical-blue border-medical-blue/40",
  Stable: "bg-medical-green/20 text-medical-green border-medical-green/40",
};

const riskRowStyles: Record<string, string> = {
  Critical: "border-l-primary bg-primary/5 critical-flash",
  High: "border-l-medical-yellow bg-medical-yellow/5",
  Moderate: "border-l-medical-blue",
  Stable: "border-l-medical-green",
};

const PatientListPage = () => {
  const { patients, statusChangeMessages } = usePatients();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = patients.filter(p =>
    p.id.toLowerCase().includes(search.toLowerCase()) ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search)
  );

  const sortOrder = { Critical: 0, High: 1, Moderate: 2, Stable: 3 };
  const sorted = [...filtered].sort((a, b) => sortOrder[a.riskLevel] - sortOrder[b.riskLevel]);

  const handlePatientClick = (p: typeof patients[0]) => {
    playPatientClickSound(p.riskLevel);
    navigate(`/patients/${p.id}`);
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-up">
        {/* Status change messages */}
        {Object.entries(statusChangeMessages).map(([pid, msg]) => (
          <div key={pid} className="mb-3 p-3 rounded-lg bg-primary/15 border border-primary/40 glow-red-border flex items-center gap-2 animate-fade-up">
            <MonitorSmartphone size={16} className="text-primary" />
            <span className="text-xs text-primary font-semibold">{msg}</span>
          </div>
        ))}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-primary" />
            <div>
              <h1 className="text-lg font-bold text-foreground">Patient List</h1>
              <p className="text-xs text-muted-foreground">{patients.length} patients registered</p>
            </div>
          </div>
          <button onClick={() => navigate("/register")} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all">
            + Register New
          </button>
        </div>

        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by Patient ID, Name, or Phone..."
            className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all" />
        </div>

        <div className="stat-card overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Patient ID", "Name", "Age", "Status", "Vitals Mode", "Diagnosis", "Admitted", ""].map(h => (
                  <th key={h} className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider text-left py-3 px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(p => (
                <tr key={p.id} onClick={() => handlePatientClick(p)}
                  className={`border-b border-border/50 border-l-2 cursor-pointer transition-all duration-300 hover:bg-secondary/50 ${riskRowStyles[p.riskLevel] || ""}`}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <Barcode size={10} className="text-muted-foreground" />
                      <span className="text-xs font-mono text-foreground">{p.id}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs font-semibold text-foreground">{p.name}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{p.age}{p.gender}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${riskColors[p.riskLevel]}`}>
                      {p.riskLevel}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {shouldShowLiveVitals(p.riskLevel) ? (
                      <span className="flex items-center gap-1 text-[10px] text-medical-green"><Wifi size={10} /> Live Monitor</span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><WifiOff size={10} /> Manual Entry</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground truncate max-w-[120px]">{p.diagnosis || "—"}</td>
                  <td className="py-3 px-4 text-[10px] text-muted-foreground">{p.admissionDate}</td>
                  <td className="py-3 px-4"><ChevronRight size={14} className="text-muted-foreground" /></td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr><td colSpan={8} className="py-8 text-center text-xs text-muted-foreground">No patients found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientListPage;
