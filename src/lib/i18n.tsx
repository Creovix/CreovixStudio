import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "en" | "ar";

const STORAGE_KEY = "creovix.lang";

const DICT = {
  en: {
    "nav.home": "Home",
    "nav.settings": "Settings",
    "nav.search": "Search widgets",
    "nav.notifications": "Notifications",
    "nav.signOut": "Sign out",
    "nav.language": "Switch language",
    "nav.profile": "Profile menu",
    "lang.arabic": "العربية",
    "lang.english": "English",
    "home.title": "Streaming tools, built for your stream.",
    "home.subtitle": "Everything you need to build, customize, and control your stream.",
    "home.searchPlaceholder": "Search widgets...",
    "home.count": "tools available",
    "home.empty": "No tools match your search.",
    "home.delete": "Delete widget",
    "cat.All": "All",
    "cat.Subathon": "Subathon",
    "cat.Goals": "Goals",
    "cat.Alerts": "Alerts",
    "cat.Chat": "Chat",
    "cat.Utilities": "Utilities",
    "connections.openStreamElements": "Open StreamElements channels & API token",
  },
  ar: {
    "nav.home": "الرئيسية",
    "nav.settings": "الإعدادات",
    "nav.search": "البحث في الأدوات",
    "nav.notifications": "الإشعارات",
    "nav.signOut": "تسجيل الخروج",
    "nav.language": "تغيير اللغة",
    "nav.profile": "قائمة الملف الشخصي",
    "lang.arabic": "العربية",
    "lang.english": "English",
    "home.title": "أدوات البث، مصممة لقناتك.",
    "home.subtitle": "كل ما تحتاجه لبناء وتخصيص والتحكم في بثك.",
    "home.searchPlaceholder": "ابحث عن أداة...",
    "home.count": "أداة متاحة",
    "home.empty": "لا توجد أدوات مطابقة لبحثك.",
    "home.delete": "حذف الودجت",
    "cat.All": "الكل",
    "cat.Subathon": "سباثون",
    "cat.Goals": "الأهداف",
    "cat.Alerts": "التنبيهات",
    "cat.Chat": "الدردشة",
    "cat.Utilities": "أدوات",
    "connections.openStreamElements": "فتح قنوات StreamElements و API Token",
  },
} as const;

export type TranslationKey = keyof (typeof DICT)["en"];

type LanguageContextValue = {
  lang: Lang;
  dir: "rtl" | "ltr";
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "ar" || stored === "en") setLangState(stored);
  }, []);

  useEffect(() => {
    const dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      dir: lang === "ar" ? "rtl" : "ltr",
      setLang,
      toggleLang: () => setLang(lang === "ar" ? "en" : "ar"),
      t: (key) => DICT[lang][key] ?? DICT.en[key] ?? key,
    }),
    [lang, setLang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      lang: "en" as Lang,
      dir: "ltr" as const,
      setLang: () => {},
      toggleLang: () => {},
      t: (key: TranslationKey) => DICT.en[key] ?? key,
    };
  }
  return ctx;
}
