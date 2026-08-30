"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  translations,
  type Language,
} from "@/lib/translations";

/* =========================================================
   TRANSLATION TYPE
========================================================= */

/**
 * Keep the exact translation structure from English,
 * but convert every text value to `string`.
 *
 * This means:
 *
 * English:
 *   save: "Save"
 *
 * Bangla:
 *   save: "সংরক্ষণ"
 *
 * Both are valid.
 */

type TranslationStrings<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends object
      ? TranslationStrings<T[K]>
      : T[K];
};

export type TranslationData =
  TranslationStrings<typeof translations.en>;

/* =========================================================
   CONTEXT TYPE
========================================================= */

interface LanguageContextValue {
  language: Language;

  setLanguage: (
    language: Language
  ) => void;

  t: TranslationData;
}

/* =========================================================
   CONTEXT
========================================================= */

const LanguageContext =
  createContext<LanguageContextValue | null>(
    null
  );

/* =========================================================
   STORAGE
========================================================= */

const STORAGE_KEY =
  "life-os-language";

/* =========================================================
   INITIAL LANGUAGE
========================================================= */

function getInitialLanguage(): Language {
  if (
    typeof window === "undefined"
  ) {
    return "en";
  }

  try {
    const saved =
      window.localStorage.getItem(
        STORAGE_KEY
      );

    if (
      saved === "en" ||
      saved === "bn"
    ) {
      return saved;
    }
  } catch {
    // Ignore localStorage errors
  }

  return "en";
}

/* =========================================================
   PROVIDER
========================================================= */

export default function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [
    language,
    setLanguageState,
  ] = useState<Language>(
    getInitialLanguage
  );

  /* =======================================================
     CHANGE LANGUAGE
  ======================================================= */

  const setLanguage = useCallback(
    (nextLanguage: Language) => {
      setLanguageState(
        nextLanguage
      );

      if (
        typeof window !== "undefined"
      ) {
        try {
          window.localStorage.setItem(
            STORAGE_KEY,
            nextLanguage
          );
        } catch {
          // Ignore localStorage errors
        }

        document.documentElement.lang =
          nextLanguage;
      }
    },
    []
  );

  /* =======================================================
     CURRENT TRANSLATION
  ======================================================= */

  const currentTranslation =
    useMemo<TranslationData>(() => {
      if (language === "bn") {
        return translations.bn as TranslationData;
      }

      return translations.en as TranslationData;
    }, [language]);

  /* =======================================================
     CONTEXT VALUE
  ======================================================= */

  const value =
    useMemo<LanguageContextValue>(
      () => ({
        language,
        setLanguage,
        t: currentTranslation,
      }),
      [
        language,
        setLanguage,
        currentTranslation,
      ]
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <LanguageContext.Provider
      value={value}
    >
      {children}
    </LanguageContext.Provider>
  );
}

/* =========================================================
   HOOK
========================================================= */

export function useLanguage() {
  const context =
    useContext(
      LanguageContext
    );

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
}