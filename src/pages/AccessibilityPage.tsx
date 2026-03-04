import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Globe, Mic, Type, WifiOff } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const AccessibilityPage = () => {
  const { t } = useLanguage();
  const [active, setActive] = useState<Record<string, boolean>>({ multilingual: false, voice: false, largetext: false, offline: false });

  const toggles = [
    { id: "multilingual", label: t("accessibility.multilingual"), desc: t("accessibility.multilingualDesc"), icon: Globe },
    { id: "voice", label: t("accessibility.voice"), desc: t("accessibility.voiceDesc"), icon: Mic },
    { id: "largetext", label: t("accessibility.largeText"), desc: t("accessibility.largeTextDesc"), icon: Type },
    { id: "offline", label: t("accessibility.offline"), desc: t("accessibility.offlineDesc"), icon: WifiOff },
  ];

  const toggle = (id: string) => setActive((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <DashboardLayout>
      <div className="animate-fade-up">
        <h1 className="text-lg font-bold text-foreground mb-1">{t("accessibility.title")}</h1>
        <p className="text-xs text-muted-foreground mb-6">{t("accessibility.subtitle")}</p>

        {active.offline && (
          <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/30 flex items-center gap-2">
            <WifiOff size={14} className="text-primary" />
            <span className="text-xs text-primary font-semibold">{t("accessibility.offlineSync")}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {toggles.map((item) => (
            <div key={item.id} className={`stat-card cursor-pointer transition-all ${active[item.id] ? "glow-red-border border-primary/40" : ""}`} onClick={() => toggle(item.id)}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${active[item.id] ? "bg-primary/15" : "bg-secondary"}`}>
                    <item.icon size={18} className={active[item.id] ? "text-primary" : "text-muted-foreground"} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                <div className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-all ${active[item.id] ? "bg-primary justify-end" : "bg-secondary justify-start"}`}>
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
