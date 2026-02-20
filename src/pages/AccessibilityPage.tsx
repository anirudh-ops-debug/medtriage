import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Globe, Mic, Type, WifiOff } from "lucide-react";

const toggles = [
  { id: "multilingual", label: "Multilingual Mode", desc: "English + Hindi + Regional Languages", icon: Globe },
  { id: "voice", label: "Voice-Based Symptom Entry", desc: "Speak symptoms for AI classification", icon: Mic },
  { id: "largetext", label: "Large Text Mode", desc: "Increase font size across the system", icon: Type },
  { id: "offline", label: "Offline Mode", desc: "Work without internet – sync when reconnected", icon: WifiOff },
];

const AccessibilityPage = () => {
  const [active, setActive] = useState<Record<string, boolean>>({ multilingual: false, voice: false, largetext: false, offline: false });

  const toggle = (id: string) => setActive((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <DashboardLayout>
      <div className="animate-fade-up">
        <h1 className="text-lg font-bold text-foreground mb-1">Accessibility Features</h1>
        <p className="text-xs text-muted-foreground mb-6">Inclusive design for all healthcare environments</p>

        {active.offline && (
          <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/30 flex items-center gap-2">
            <WifiOff size={14} className="text-primary" />
            <span className="text-xs text-primary font-semibold">Offline Mode – Sync Pending</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {toggles.map((t) => (
            <div key={t.id} className={`stat-card cursor-pointer transition-all ${active[t.id] ? "glow-red-border border-primary/40" : ""}`} onClick={() => toggle(t.id)}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${active[t.id] ? "bg-primary/15" : "bg-secondary"}`}>
                    <t.icon size={18} className={active[t.id] ? "text-primary" : "text-muted-foreground"} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.label}</p>
                    <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                  </div>
                </div>
                <div className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-all ${active[t.id] ? "bg-primary justify-end" : "bg-secondary justify-start"}`}>
                  <div className="w-4 h-4 rounded-full bg-foreground" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AccessibilityPage;
