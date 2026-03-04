import DashboardLayout from "@/components/DashboardLayout";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const ArchitecturePage = () => {
  const { t } = useLanguage();

  const steps = [
    { label: t("architecture.step1"), desc: t("architecture.step1Desc") },
    { label: t("architecture.step2"), desc: t("architecture.step2Desc") },
    { label: t("architecture.step3"), desc: t("architecture.step3Desc") },
    { label: t("architecture.step4"), desc: t("architecture.step4Desc") },
    { label: t("architecture.step5"), desc: t("architecture.step5Desc") },
    { label: t("architecture.step6"), desc: t("architecture.step6Desc") },
    { label: t("architecture.step7"), desc: t("architecture.step7Desc") },
  ];

  return (
    <DashboardLayout>
      <div className="animate-fade-up">
        <h1 className="text-lg font-bold text-foreground mb-1">{t("architecture.title")}</h1>
        <p className="text-xs text-muted-foreground mb-8">{t("architecture.subtitle")}</p>

        <div className="flex flex-col items-center gap-1">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="stat-card w-96 text-center">
                <p className="text-sm font-bold text-foreground">{step.label}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{step.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="py-2">
                  <ArrowRight size={18} className="text-primary rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ArchitecturePage;
