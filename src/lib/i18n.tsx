import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ar" | "es";

export const LANGS: { code: Lang; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "ar", label: "AR" },
  { code: "es", label: "ES" },
];

const dict = {
  brand: {
    en: "ECLIPSE — Market Intelligence Terminal",
    ar: "إكليبس — تيرمينال الذكاء السوقي",
    es: "ECLIPSE — Terminal de Inteligencia de Mercado",
  },
  tagline: {
    en: "See the market shift before it happens.",
    ar: "استشعر تحوّل السوق قبل أن يحدث.",
    es: "Anticipa el cambio del mercado antes de que ocurra.",
  },
  live: {
    en: "LIVE EGX STREAM: ACTIVE",
    ar: "بث البورصة المصرية اللحظي: نشط",
    es: "FLUJO EGX EN VIVO: ACTIVO",
  },
  market: { en: "Market Live", ar: "السوق المباشر", es: "Mercado en vivo" },
  scanner: { en: "Pattern Scanner", ar: "ماسح النماذج الفنية", es: "Escáner de patrones" },
  news: { en: "News & Sentiment", ar: "الأخبار وقراءة المشاعر", es: "Noticias y sentimiento" },
  pivot: { en: "Pivot Calculator", ar: "حاسبة النقاط المحورية", es: "Calculadora de pivotes" },
  portfolio: { en: "My Portfolio", ar: "محفظتي", es: "Mi cartera" },
  events: { en: "Events", ar: "التوزيعات والأحداث", es: "Eventos" },
  alerts: { en: "Price Alerts", ar: "تنبيهات الأسعار", es: "Alertas de precio" },

  searchPlaceholder: {
    en: "Search symbol or company name…",
    ar: "ابحث بالرمز أو اسم الشركة…",
    es: "Busca símbolo o nombre de empresa…",
  },
  modules: { en: "Modules", ar: "الوحدات", es: "Módulos" },
  signOut: { en: "Sign out", ar: "تسجيل الخروج", es: "Cerrar sesión" },
  language: { en: "Language", ar: "اللغة", es: "Idioma" },
  upgradeToPro: { en: "Upgrade PRO", ar: "ترقية PRO", es: "Mejorar a PRO" },
  adminPanel: { en: "Admin Panel", ar: "لوحة المالك", es: "Panel de administrador" },
  fullSymbol: { en: "Full EGX symbol", ar: "رمز السهم الكامل", es: "Símbolo EGX completo" },
  loadChart: { en: "Load live chart", ar: "تحميل الرسم المباشر", es: "Cargar gráfico en vivo" },
  fullScreener: {
    en: "Full EGX Market Screener",
    ar: "الماسح الشامل للبورصة المصرية",
    es: "Escáner completo del mercado EGX",
  },
  fullScreen: { en: "Full screen chart", ar: "شاشة كاملة", es: "Pantalla completa" },
  close: { en: "Close", ar: "إغلاق", es: "Cerrar" },
  escHint: {
    en: "Press ESC to exit full screen",
    ar: "اضغط ESC للخروج من وضع الشاشة الكاملة",
    es: "Pulsa ESC para salir de pantalla completa",
  },
  scrubHint: {
    en: "Drag across the chart to inspect price",
    ar: "اسحب على الرسم لعرض السعر",
    es: "Desliza sobre el gráfico para ver el precio",
  },
  indices: { en: "Indices", ar: "المؤشرات", es: "Índices" },
  all: { en: "ALL", ar: "الكل", es: "TODOS" },
  watchlist: { en: "Watchlist", ar: "قائمة المتابعة", es: "Seguimiento" },
  addWatchlist: { en: "Add to watchlist", ar: "أضف لقائمة المتابعة", es: "Añadir a seguimiento" },
  removeWatchlist: {
    en: "Remove from watchlist",
    ar: "إزالة من قائمة المتابعة",
    es: "Quitar de seguimiento",
  },
  emptyWatchlist: {
    en: "Your watchlist is empty — star any stock to track it here.",
    ar: "قائمة المتابعة فارغة — أضف أي سهم لتتبعه هنا.",
    es: "Tu lista está vacía: añade acciones para seguirlas aquí.",
  },
  noResults: { en: "No matching stocks", ar: "لا توجد نتائج مطابقة", es: "Sin resultados" },
  price: { en: "Price", ar: "السعر", es: "Precio" },
  changeD: { en: "Change", ar: "التغير", es: "Variación" },
  volume: { en: "Volume", ar: "حجم التداول", es: "Volumen" },
  support: { en: "Support", ar: "الدعم", es: "Soporte" },
  resistance: { en: "Resistance", ar: "المقاومة", es: "Resistencia" },
  interactiveChart: {
    en: "Interactive price chart",
    ar: "الرسم البياني التفاعلي",
    es: "Gráfico interactivo",
  },
  advancedChart: {
    en: "Advanced TradingView chart",
    ar: "الرسم المتقدم TradingView",
    es: "Gráfico avanzado TradingView",
  },
  detectedPatterns: { en: "Detected patterns", ar: "النماذج المكتشفة", es: "Patrones detectados" },
  confidence: { en: "Confidence", ar: "درجة الثقة", es: "Confianza" },
  bullish: { en: "Bullish", ar: "صاعد", es: "Alcista" },
  bearish: { en: "Bearish", ar: "هابط", es: "Bajista" },
  openChart: { en: "Open chart", ar: "فتح الرسم البياني", es: "Abrir gráfico" },
  bullishEngulfing: { en: "Bullish Engulfing", ar: "ابتلاع شرائي", es: "Envolvente alcista" },
  doubleBottom: { en: "Double Bottom", ar: "قاع مزدوج", es: "Doble suelo" },
  ascendingTriangle: { en: "Ascending Triangle", ar: "مثلث صاعد", es: "Triángulo ascendente" },
  headShoulders: { en: "Head & Shoulders", ar: "رأس وكتفين", es: "Hombro-cabeza-hombro" },
  cupHandle: { en: "Cup & Handle", ar: "كوب وعروة", es: "Taza con asa" },
  fallingWedge: { en: "Falling Wedge", ar: "وتد هابط", es: "Cuña descendente" },
} as const;

export type DictKey = keyof typeof dict;

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  dir: "rtl" | "ltr";
  t: (k: DictKey) => string;
};

const LangCtx = createContext<Ctx>({
  lang: "en",
  setLang: () => {},
  dir: "ltr",
  t: (k) => dict[k].en,
});

const STORAGE_KEY = "egx-pulse-lang";

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved && LANGS.some((l) => l.code === saved)) setLangState(saved);
  }, []);

  const dir: "rtl" | "ltr" = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback((k: DictKey) => dict[k][lang], [lang]);

  return <LangCtx.Provider value={{ lang, setLang, dir, t }}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);

import type { Stock } from "@/lib/egx-data";

export const stockName = (s: Stock, lang: Lang) =>
  lang === "ar" ? s.nameAr : lang === "es" ? s.nameEs : s.nameEn;

export const sectorName = (s: Stock, lang: Lang) =>
  lang === "ar" ? s.sectorAr : lang === "es" ? s.sectorEs : s.sector;
