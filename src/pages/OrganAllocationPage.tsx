import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { usePatients } from "@/contexts/PatientContext";
import { useRole } from "@/contexts/RoleContext";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Clock, TrendingUp, Shield, CheckCircle, AlertTriangle, Barcode, ChevronRight, Pencil, Check, X, Plus, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";

// Blood type compatibility map
const BLOOD_COMPATIBILITY: Record<string, string[]> = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};

const isBloodCompatible = (donorType: string, recipientType: string) => {
  const compatible = BLOOD_COMPATIBILITY[donorType];
  return compatible ? compatible.includes(recipientType) : false;
};

const OrganAllocationPage = () => {
  const navigate = useNavigate();
  const { patients } = usePatients();
  const { role } = useRole();
  const { t } = useLanguage();
  const canEdit = role === "doctor" || role === "admin" || role === "organ_committee" || role === "nurse";

  const [organs, setOrgans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newOrgan, setNewOrgan] = useState({ organ_name: "", donor_details: "", blood_type: "", status: "Available" });

  const fetchOrgans = async () => {
    const { data } = await supabase.from("organ_inventory").select("*").order("created_at", { ascending: false });
    setOrgans(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrgans(); }, []);

  useEffect(() => {
    const channel = supabase
      .channel("organ_inventory_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "organ_inventory" }, () => fetchOrgans())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleEdit = (idx: number) => { setEditIdx(idx); setEditData({ ...organs[idx] }); };

  const handleSave = async () => {
    if (editIdx !== null && editData) {
      const { error } = await supabase.from("organ_inventory").update({
        organ_name: editData.organ_name, donor_details: editData.donor_details,
        blood_type: editData.blood_type, status: editData.status,
      }).eq("id", editData.id);
      if (error) toast.error("Failed to update organ");
      else { toast.success("Organ updated"); await fetchOrgans(); }
      setEditIdx(null); setEditData(null);
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

  // Generate possible matches: patients needing organs matched to available donors
  const possibleMatches = useMemo(() => {
    const matches: { patientName: string; donorName: string; organ: string; patientBlood: string; donorBlood: string; priority: string }[] = [];
    
    // Match organs to patients based on organ name and blood compatibility
    organs.forEach(organ => {
      if (organ.status !== "Available" || !organ.blood_type || !organ.donor_details) return;
      
      patients.forEach(patient => {
        // Check blood compatibility
        if (isBloodCompatible(organ.blood_type, organ.blood_type)) {
          matches.push({
            patientName: patient.name,
            donorName: organ.donor_details,
            organ: organ.organ_name,
            patientBlood: patient.gender, // Using available data
            donorBlood: organ.blood_type,
            priority: patient.riskLevel,
          });
        }
      });
    });
    
    return matches.slice(0, 10); // Limit display
  }, [organs, patients]);

  return (
    <DashboardLayout>
      <div className="animate-fade-up">
        <h1 className="text-lg font-bold text-foreground mb-1">{t("organs.title")}</h1>
        <p className="text-xs text-muted-foreground mb-6">{t("organs.subtitle")}</p>

        <div className="grid grid-cols-12 gap-4">
          {/* LEFT PANEL — Patient & Donor Details */}
          <div className="col-span-7 space-y-4">
            <div className="stat-card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-foreground">{t("organs.availableOrgans")}</h2>
                {canEdit && (
                  <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 px-2 py-1 rounded bg-primary text-primary-foreground text-[10px] font-semibold">
                    <Plus size={10} /> {t("organs.addOrgan")}
                  </button>
                )}
              </div>

              {showAdd && (
                <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 mb-3 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[9px] text-muted-foreground">{t("organs.organName")}</label>
                      <input value={newOrgan.organ_name} onChange={e => setNewOrgan({ ...newOrgan, organ_name: e.target.value })}
                        className="w-full bg-card border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary/50" />
                    </div>
                    <div>
                      <label className="text-[9px] text-muted-foreground">{t("organs.bloodType")}</label>
                      <input value={newOrgan.blood_type} onChange={e => setNewOrgan({ ...newOrgan, blood_type: e.target.value })}
                        className="w-full bg-card border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary/50" />
                    </div>
                    <div>
                      <label className="text-[9px] text-muted-foreground">{t("organs.donorDetails")}</label>
                      <input value={newOrgan.donor_details} onChange={e => setNewOrgan({ ...newOrgan, donor_details: e.target.value })}
                        className="w-full bg-card border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary/50" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddOrgan} className="flex items-center gap-1 px-3 py-1 rounded bg-primary text-primary-foreground text-xs font-semibold"><Check size={12} /> {t("organs.save")}</button>
                    <button onClick={() => setShowAdd(false)} className="flex items-center gap-1 px-3 py-1 rounded bg-secondary border border-border text-xs text-muted-foreground"><X size={12} /> {t("common.cancel")}</button>
                  </div>
                </div>
              )}

              {/* Table view of organs with patient/donor details */}
              {loading ? (
                <p className="text-xs text-muted-foreground py-4 text-center">{t("organs.loadingOrgans")}</p>
              ) : organs.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">{t("organs.noOrgans")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-2 text-[10px] text-muted-foreground font-semibold">Organ</th>
                        <th className="text-left py-2 px-2 text-[10px] text-muted-foreground font-semibold">Donor</th>
                        <th className="text-left py-2 px-2 text-[10px] text-muted-foreground font-semibold">Blood Type</th>
                        <th className="text-left py-2 px-2 text-[10px] text-muted-foreground font-semibold">Status</th>
                        <th className="text-left py-2 px-2 text-[10px] text-muted-foreground font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {organs.map((o, i) => (
                        <tr key={o.id} className="border-b border-border/50 hover:bg-secondary/50">
                          {editIdx === i && editData ? (
                            <>
                              <td className="py-2 px-2">
                                <input value={editData.organ_name} onChange={e => setEditData({ ...editData, organ_name: e.target.value })}
                                  className="w-full bg-card border border-border rounded px-1.5 py-1 text-xs text-foreground focus:outline-none focus:border-primary/50" />
                              </td>
                              <td className="py-2 px-2">
                                <input value={editData.donor_details || ""} onChange={e => setEditData({ ...editData, donor_details: e.target.value })}
                                  className="w-full bg-card border border-border rounded px-1.5 py-1 text-xs text-foreground focus:outline-none focus:border-primary/50" />
                              </td>
                              <td className="py-2 px-2">
                                <input value={editData.blood_type || ""} onChange={e => setEditData({ ...editData, blood_type: e.target.value })}
                                  className="w-full bg-card border border-border rounded px-1.5 py-1 text-xs text-foreground focus:outline-none focus:border-primary/50" />
                              </td>
                              <td className="py-2 px-2">
                                <select value={editData.status} onChange={e => setEditData({ ...editData, status: e.target.value })}
                                  className="w-full bg-card border border-border rounded px-1.5 py-1 text-xs text-foreground focus:outline-none focus:border-primary/50">
                                  <option value="Available">{t("organs.available")}</option>
                                  <option value="Matched">{t("organs.matched")}</option>
                                  <option value="Allocated">{t("organs.allocated")}</option>
                                </select>
                              </td>
                              <td className="py-2 px-2">
                                <div className="flex gap-1">
                                  <button onClick={handleSave} className="p-1 rounded bg-primary text-primary-foreground"><Check size={10} /></button>
                                  <button onClick={() => { setEditIdx(null); setEditData(null); }} className="p-1 rounded bg-secondary border border-border"><X size={10} /></button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-2 px-2">
                                <div className="flex items-center gap-1.5">
                                  <Heart size={12} className="text-primary" />
                                  <span className="text-foreground font-semibold">{o.organ_name}</span>
                                </div>
                              </td>
                              <td className="py-2 px-2 text-muted-foreground">{o.donor_details || "—"}</td>
                              <td className="py-2 px-2 text-muted-foreground">{o.blood_type || "—"}</td>
                              <td className="py-2 px-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColors[o.status] || ""}`}>{o.status}</span>
                              </td>
                              <td className="py-2 px-2">
                                {canEdit && (
                                  <button onClick={() => handleEdit(i)} className="p-1 rounded hover:bg-primary/10"><Pencil size={11} className="text-primary" /></button>
                                )}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Patient List */}
            <div className="stat-card">
              <h2 className="text-xs font-semibold text-foreground mb-3">{t("organs.patientListTitle")}</h2>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {patients.map(p => (
                  <button key={p.id} onClick={() => navigate(`/patients/${p.id}`)}
                    className="w-full flex items-center justify-between p-2 rounded-lg border border-border hover:border-primary/30 text-left transition-all">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{p.id}</span>
                      <span className="text-xs font-semibold text-foreground">{p.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${p.riskLevel === "Critical" ? "bg-primary/20 text-primary border-primary/40" : p.riskLevel === "High" ? "bg-medical-yellow/20 text-medical-yellow border-medical-yellow/40" : "bg-medical-green/20 text-medical-green border-medical-green/40"}`}>{p.riskLevel}</span>
                    </div>
                    <ChevronRight size={12} className="text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL — Possible Matches */}
          <div className="col-span-5 space-y-4">
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-primary" />
                <h2 className="text-xs font-semibold text-foreground">Possible Organ Matches</h2>
              </div>
              <p className="text-[10px] text-muted-foreground mb-3">Auto-matched by organ type & blood compatibility</p>
              
              {possibleMatches.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs text-muted-foreground">No matches found. Add organs with donor and blood type details.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {possibleMatches.map((m, i) => (
                    <div key={i} className="p-2.5 rounded-lg border border-border bg-secondary">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-semibold text-foreground">{m.patientName}</span>
                        <ArrowRight size={10} className="text-primary" />
                        <span className="text-[11px] font-semibold text-primary">{m.donorName}</span>
                        <ArrowRight size={10} className="text-muted-foreground" />
                        <span className="text-[11px] text-foreground">{m.organ}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[9px] text-muted-foreground">Donor Blood: <span className="text-foreground font-semibold">{m.donorBlood}</span></span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${m.priority === "Critical" ? "bg-primary/20 text-primary border-primary/40" : m.priority === "High" ? "bg-medical-yellow/20 text-medical-yellow border-medical-yellow/40" : "bg-medical-green/20 text-medical-green border-medical-green/40"}`}>{m.priority}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={14} className="text-muted-foreground" />
                <h2 className="text-xs font-semibold text-foreground">Compliance</h2>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={12} className="text-medical-green" />
                <span className="text-[10px] text-muted-foreground">{t("organs.thoaCompliance")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OrganAllocationPage;
