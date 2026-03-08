import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Database, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const SeedDataPage = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState("");

  const handleSeed = async () => {
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const { data, error } = await supabase.functions.invoke("seed-data");
      if (error) throw error;
      setResults(data.results || []);
    } catch (e: any) {
      setError(e.message || "Failed to seed data");
    }
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-up max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Database size={18} className="text-primary" />
          <h1 className="text-lg font-bold text-foreground">Seed System Data</h1>
        </div>

        <div className="stat-card space-y-4">
          <p className="text-xs text-muted-foreground">
            Load 10 doctors, 10 nurses, and 20 patients (with symptoms, medical history, and diagnoses) from CSV data.
            Doctors and nurses are assigned fairly using round-robin distribution.
          </p>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg bg-secondary border border-border">
              <p className="text-lg font-bold text-foreground">10</p>
              <p className="text-[10px] text-muted-foreground">Doctors</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary border border-border">
              <p className="text-lg font-bold text-foreground">10</p>
              <p className="text-[10px] text-muted-foreground">Nurses</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary border border-border">
              <p className="text-lg font-bold text-foreground">20</p>
              <p className="text-[10px] text-muted-foreground">Patients</p>
            </div>
          </div>

          <button onClick={handleSeed} disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={14} className="animate-spin" /> Seeding data...</> : <><Database size={14} /> Seed All Data</>}
          </button>

          {error && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 flex items-center gap-2">
              <AlertTriangle size={14} className="text-primary" />
              <span className="text-xs text-primary">{error}</span>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Results</p>
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-2 py-1">
                  <CheckCircle size={10} className="text-medical-green shrink-0" />
                  <span className="text-[11px] text-foreground">{r}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SeedDataPage;
