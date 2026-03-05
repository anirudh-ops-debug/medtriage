import { useLanguage } from "@/i18n/LanguageContext";
import { Globe } from "lucide-react";

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-secondary border border-border">
      <Globe size={12} className="text-muted-foreground" />
      <button
        onClick={() => setLanguage("en")}
        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
          language === "en"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        English
      </button>
      <button
        onClick={() => setLanguage("ta")}
        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
          language === "ta"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        தமிழ்
      </button>
      <button
        onClick={() => setLanguage("hi")}
        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
          language === "hi"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        हिन्दी
      </button>
    </div>
  );
};

export default LanguageToggle;
