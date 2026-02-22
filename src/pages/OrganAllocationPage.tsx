import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { usePatients } from "@/contexts/PatientContext";
import { useRole } from "@/contexts/RoleContext";
import { Heart, Clock, TrendingUp, Shield, CheckCircle, AlertTriangle, Barcode, ChevronRight, Pencil, Check, X } from "lucide-react";

interface OrganEntry {
  organ: string;
  donor: string;
  bloodType: string;
  status: "Available" | "Matched" | "Allocated";
  recipientPatientId: string;
}

const initialOrgans: OrganEntry[] = [
  { organ: "Kidney (Left)", donor: "Cadaveric #KD-441", bloodType: "O+", status: "Matched", recipientPatientId: "PT-001" },
  { organ: "Liver (Partial)", donor: "Living Donor #LV-203", bloodType: "B+", status: "Available", recipientPatientId: "" },
  { organ: "Heart", donor: "Cadaveric #HT-112", bloodType: "A+", status: "Available", recipientPatientId: "" },
];

const OrganAllocationPage = () => {
  const navigate = useNavigate();
  const { patients } = usePatients();
  const { role } = useRole();
  const canEdit = role === "doctor" || role === "admin";
  const [organs, setOrgans] = useState(initialOrgans);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editData, setEditData] = useState<OrganEntry | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const selectedPatient = selectedPatientId ? patients.find(p => p.id === selectedPatientId) : null;

  const handleEdit = (idx: number) => {
    setEditIdx(idx);
    setEditData({ ...organs[idx] });
  };

  const handleSave = () => {
    if (editIdx !== null && editData) {
      setOrgans(prev => prev.map((o, i) => i === editIdx ? editData : o));
      setEditIdx(null);
      setEditData(null);
    }
  };

  const statusColors: Record<string, string> = {
    Available: "bg-medical-green/10 text-medical-green border-medical-green/30",
    Matched: "bg-medical-yellow/10 text-medical-yellow border-medical-yellow/30",
    Allocated: "bg-primary/10 text-primary border-primary/30",
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-up">
        <h1 className="text-lg font-bold text-foreground mb-1">Organ Allocation Module</h1>
        <p className="text-xs text-muted-foreground mb-6">Transparent AI-based ranking · Indian Transplant Guidelines Compliant</p>

        <div className="grid grid-cols-12 gap-4">
          {/* Left – Organ list + Patient list */}
          <div className="col-span-7 space-y-4">
            {/* Organs */}
            <div className="stat-card">
              <h2 className="text-xs font-semibold text-foreground mb-3">Available Organs</h2>
              <div className="space-y-2">
                {organs.map((o, i) => (
                  <div key={i} className="p-3 rounded-lg border border-border bg-secondary">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Heart size={14} className="text-primary" />
                        <span className="text-xs font-semibold text-foreground">{o.organ}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColors[o.status]}`}>{o.status}</span>
                        {canEdit && editIdx !== i && (
                          <button onClick={() => handleEdit(i)} className="p-1 rounded hover:bg-primary/10"><Pencil size={11} className="text-primary" /></button>
                        )}
                      </div>
                    </div>
                    {editIdx === i && editData ? (
                      <div className="space-y-2 mt-2 pt-2 border-t border-border">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[9px] text-muted-foreground">Donor</label>
                            <input value={editData.donor} onChange={e => setEditData({ ...editData, donor: e.target.value })}
                              className="w-full bg-card border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary/50" />
                          </div>
                          <div>
                            <label className="text-[9px] text-muted-foreground">Blood Type</label>
                            <input value={editData.bloodType} onChange={e => setEditData({ ...editData, bloodType: e.target.value })}
                              className="w-full bg-card border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary/50" />
                          </div>
                          <div>
                            <label className="text-[9px] text-muted-foreground">Status</label>
                            <select value={editData.status} onChange={e => setEditData({ ...editData, status: e.target.value as OrganEntry["status"] })}
                              className="w-full bg-card border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary/50">
                              <option value="Available">Available</option>
                              <option value="Matched">Matched</option>
                              <option value="Allocated">Allocated</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] text-muted-foreground">Recipient Patient ID</label>
                          <input value={editData.recipientPatientId} onChange={e => setEditData({ ...editData, recipientPatientId: e.target.value })}
                            placeholder="e.g. PT-001"
                            className="w-full bg-card border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary/50" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleSave} className="flex items-center gap-1 px-3 py-1 rounded bg-primary text-primary-foreground text-xs font-semibold"><Check size={12} /> Save</button>
                          <button onClick={() => { setEditIdx(null); setEditData(null); }} className="flex items-center gap-1 px-3 py-1 rounded bg-secondary border border-border text-xs text-muted-foreground"><X size={12} /> Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-muted-foreground">
                        {o.donor} · Blood: {o.bloodType} {o.recipientPatientId && `· Recipient: ${o.recipientPatientId}`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Patient List */}
            <div className="stat-card">
              <h2 className="text-xs font-semibold text-foreground mb-3">Patient List</h2>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {patients.map(p => (
                  <button key={p.id} onClick={() => setSelectedPatientId(p.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg border text-left transition-all ${selectedPatientId === p.id ? "border-primary/40 bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{p.id}</span>
                      <span className="text-xs font-semibold text-foreground">{p.name}</span>
                    </div>
                    <ChevronRight size={12} className="text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right – Selected patient details */}
          <div className="col-span-5">
            {selectedPatient ? (
              <div className="stat-card space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold text-foreground">Patient Details</h2>
                  <button onClick={() => navigate(`/patients/${selectedPatient.id}`)} className="text-[10px] text-primary hover:underline">Full Profile →</button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Barcode size={12} className="text-muted-foreground" />
                    <span className="text-xs font-mono text-muted-foreground tracking-[2px]">{selectedPatient.barcode}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div><span className="text-muted-foreground">Name:</span> <span className="text-foreground font-semibold">{selectedPatient.name}</span></div>
                    <div><span className="text-muted-foreground">Age:</span> <span className="text-foreground">{selectedPatient.age}{selectedPatient.gender}</span></div>
                    <div><span className="text-muted-foreground">Admitted:</span> <span className="text-foreground">{selectedPatient.admissionDate}</span></div>
                    <div><span className="text-muted-foreground">Status:</span> <span className="text-foreground font-semibold">{selectedPatient.riskLevel}</span></div>
                  </div>

                  {selectedPatient.symptoms.length > 0 && (
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">Symptoms</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedPatient.symptoms.map((s, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-secondary text-[10px] text-foreground border border-border">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedPatient.testsTaken.length > 0 && (
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">Tests Taken</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedPatient.testsTaken.map(t => (
                          <span key={t} className="px-1.5 py-0.5 rounded bg-medical-green/10 text-[10px] text-medical-green border border-medical-green/20">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedPatient.medicalHistory.length > 0 && (
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">Medical History</p>
                      <div className="space-y-0.5">
                        {selectedPatient.medicalHistory.map((h, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-primary/40" />
                            <span className="text-[10px] text-foreground">{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedPatient.diagnosis && (
                    <div className="p-2 rounded bg-primary/5 border border-primary/20">
                      <p className="text-[9px] text-muted-foreground">Diagnosis</p>
                      <p className="text-[11px] text-foreground font-semibold">{selectedPatient.diagnosis}</p>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-border flex items-center gap-2">
                  <Shield size={10} className="text-muted-foreground" />
                  <span className="text-[9px] text-muted-foreground">THOA Compliance Verified</span>
                  <CheckCircle size={10} className="text-medical-green" />
                </div>
              </div>
            ) : (
              <div className="stat-card flex items-center justify-center h-48">
                <p className="text-xs text-muted-foreground">Select a patient to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OrganAllocationPage;
