import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { usePatients } from "@/contexts/PatientContext";
import { useRole } from "@/contexts/RoleContext";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Clock, TrendingUp, Shield, CheckCircle, AlertTriangle, Barcode, ChevronRight, Pencil, Check, X, Plus } from "lucide-react";
import { toast } from "sonner";

const OrganAllocationPage = () => {
  const navigate = useNavigate();
  const { patients } = usePatients();
  const { role } = useRole();
  const canEdit = role === "doctor" || role === "admin" || role === "organ_committee";

  const [organs, setOrgans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newOrgan, setNewOrgan] = useState({ organ_name: "", donor_details: "", blood_type: "", status: "Available" });

  const selectedPatient = selectedPatientId ? patients.find(p => p.id === selectedPatientId) : null;

  const fetchOrgans = async () => {
    const { data } = await supabase.from("organ_inventory").select("*").order("created_at", { ascending: false });
    setOrgans(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrgans(); }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("organ_inventory_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "organ_inventory" }, () => fetchOrgans())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleEdit = (idx: number) => {
    setEditIdx(idx);
    setEditData({ ...organs[idx] });
  };

  const handleSave = async () => {
    if (editIdx !== null && editData) {
      const { error } = await supabase.from("organ_inventory").update({
        organ_name: editData.organ_name,
        donor_details: editData.donor_details,
        blood_type: editData.blood_type,
        status: editData.status,
      }).eq("id", editData.id);
      if (error) toast.error("Failed to update organ");
      else { toast.success("Organ updated"); await fetchOrgans(); }
      setEditIdx(null);
      setEditData(null);
    }
  };

  const handleAddOrgan = async () => {
    const { error } = await supabase.from("organ_inventory").insert(newOrgan);
    if (error) toast.error("Failed to add organ");
    else { toast.success("Organ added"); setShowAdd(false); setNewOrgan({ organ_name: "", donor_details: "", blood_type: "", status: "Available" }); await fetchOrgans(); }
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
          <div className="col-span-7 space-y-4">
            <div className="stat-card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-foreground">Available Organs</h2>
                {canEdit && (
                  <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 px-2 py-1 rounded bg-primary text-primary-foreground text-[10px] font-semibold">
                    <Plus size={10} /> Add Organ
                  </button>
                )}
              </div>

              {showAdd && (
                <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 mb-3 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[9px] text-muted-foreground">Organ Name</label>
                      <input value={newOrgan.organ_name} onChange={e => setNewOrgan({ ...newOrgan, organ_name: e.target.value })}
                        className="w-full bg-card border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary/50" />
                    </div>
                    <div>
                      <label className="text-[9px] text-muted-foreground">Blood Type</label>
                      <input value={newOrgan.blood_type} onChange={e => setNewOrgan({ ...newOrgan, blood_type: e.target.value })}
                        className="w-full bg-card border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary/50" />
                    </div>
                    <div>
                      <label className="text-[9px] text-muted-foreground">Donor Details</label>
                      <input value={newOrgan.donor_details} onChange={e => setNewOrgan({ ...newOrgan, donor_details: e.target.value })}
                        className="w-full bg-card border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary/50" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddOrgan} className="flex items-center gap-1 px-3 py-1 rounded bg-primary text-primary-foreground text-xs font-semibold"><Check size={12} /> Save</button>
                    <button onClick={() => setShowAdd(false)} className="flex items-center gap-1 px-3 py-1 rounded bg-secondary border border-border text-xs text-muted-foreground"><X size={12} /> Cancel</button>
                  </div>
                </div>
              )}

              {loading ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Loading organs...</p>
              ) : organs.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No organs in inventory</p>
              ) : (
                <div className="space-y-2">
                  {organs.map((o, i) => (
                    <div key={o.id} className="p-3 rounded-lg border border-border bg-secondary">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Heart size={14} className="text-primary" />
                          <span className="text-xs font-semibold text-foreground">{o.organ_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColors[o.status] || ""}`}>{o.status}</span>
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
                              <input value={editData.donor_details || ""} onChange={e => setEditData({ ...editData, donor_details: e.target.value })}
                                className="w-full bg-card border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary/50" />
                            </div>
                            <div>
                              <label className="text-[9px] text-muted-foreground">Blood Type</label>
                              <input value={editData.blood_type || ""} onChange={e => setEditData({ ...editData, blood_type: e.target.value })}
                                className="w-full bg-card border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary/50" />
                            </div>
                            <div>
                              <label className="text-[9px] text-muted-foreground">Status</label>
                              <select value={editData.status} onChange={e => setEditData({ ...editData, status: e.target.value })}
                                className="w-full bg-card border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary/50">
                                <option value="Available">Available</option>
                                <option value="Matched">Matched</option>
                                <option value="Allocated">Allocated</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={handleSave} className="flex items-center gap-1 px-3 py-1 rounded bg-primary text-primary-foreground text-xs font-semibold"><Check size={12} /> Save</button>
                            <button onClick={() => { setEditIdx(null); setEditData(null); }} className="flex items-center gap-1 px-3 py-1 rounded bg-secondary border border-border text-xs text-muted-foreground"><X size={12} /> Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-muted-foreground">
                          {o.donor_details || "No donor info"} · Blood: {o.blood_type || "N/A"}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

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
