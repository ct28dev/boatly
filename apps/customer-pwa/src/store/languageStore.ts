import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  translations,
  type Locale,
  type TranslationKey,
  interpolate,
} from '@/utils/translations';

interface LanguageState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      locale: 'th',

      setLocale: (locale) => {
        set({ locale });
        if (typeof document !== 'undefined') {
          document.documentElement.lang = locale;
        }
      },

      t: (key, params) => {
        const { locale } = get();
        const value = translations[locale]?.[key] || translations.th[key] || key;
        if (params) {
          return interpolate(value, params);
        }
        return value;
      },
    }),
    {
      name: 'boatly-language',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') return localStorage;
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({ locale: state.locale }),
    }
  )
);
