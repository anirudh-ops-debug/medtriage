import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import en from "./en.json";
import ta from "./ta.json";
import hi from "./hi.json";

type Language = "en" | "ta" | "hi";
type Translations = typeof en;

const translations: Record<Language, Translations> = { en, ta, hi };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}


const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getNestedValue(obj: any, path: string): string {
  const result = path.split(".").reduce((acc, part) => acc?.[part], obj);
  return typeof result === "string" ? result : path;
}

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem("medtriage-lang");
    return (stored === "ta" || stored === "hi" ? stored : "en") as Language;
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("medtriage-lang", lang);
  }, []);

  const t = useCallback(
    (key: string) => getNestedValue(translations[language], key),
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
