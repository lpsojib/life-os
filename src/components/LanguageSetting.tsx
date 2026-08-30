"use client";

import {
  Check,
  Languages,
} from "lucide-react";

import {
  useLanguage,
} from "@/components/LanguageProvider";

export default function LanguageSetting() {
  const {
    language,
    setLanguage,
    t,
  } = useLanguage();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
          <Languages size={20} />
        </div>

        <div>
          <h3 className="font-semibold">
            {t.settings.language}
          </h3>

          <p className="text-sm text-slate-500">
            {t.settings.languageDescription}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() =>
            setLanguage("en")
          }
          className={`flex items-center justify-between rounded-xl border px-4 py-3 transition ${
            language === "en"
              ? "border-blue-500 bg-blue-50"
              : "border-slate-200"
          }`}
        >
          <span>
            {t.settings.english}
          </span>

          {language === "en" && (
            <Check size={18} />
          )}
        </button>

        <button
          type="button"
          onClick={() =>
            setLanguage("bn")
          }
          className={`flex items-center justify-between rounded-xl border px-4 py-3 transition ${
            language === "bn"
              ? "border-blue-500 bg-blue-50"
              : "border-slate-200"
          }`}
        >
          <span>
            {t.settings.bangla}
          </span>

          {language === "bn" && (
            <Check size={18} />
          )}
        </button>
      </div>
    </div>
  );
}