import DashboardLayout from "@/components/DashboardLayout";
import { Globe, Ambulance, Thermometer, Database, BarChart3 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const FutureScopePage = () => {
  const { t } = useLanguage();

  const items = [
    { icon: Globe, title: t("future.item1"), desc: t("future.item1Desc") },
    { icon: Ambulance, title: t("future.item2"), desc: t("future.item2Desc") },
    { icon: Thermometer, title: t("future.item3"), desc: t("future.item3Desc") },
    { icon: Database, title: t("future.item4"), desc: t("future.item4Desc") },
    { icon: BarChart3, title: t("future.item5"), desc: t("future.item5Desc") },
  ];

  return (
    <DashboardLayout>
      <div className="animate-fade-up">
        <h1 className="text-lg font-bold text-foreground mb-1">{t("future.title")}</h1>
        <p className="text-xs text-muted-foreground mb-6">{t("future.subtitle")}</p>

        <div className="grid grid-cols-3 gap-4">
          {items.map((item, i) => (
            <div key={i} className="stat-card group hover:glow-red-border hover:border-primary/30 transition-all duration-300">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <item.icon size={20} className="text-primary" />
              </div>
              <h3 className="text-sm font-bold text-foreground mb-1">{item.title}</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FutureScopePage;
