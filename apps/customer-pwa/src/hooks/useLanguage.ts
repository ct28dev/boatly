import { useCallback } from 'react';
import { useRouter } from 'next/router';
import { useLanguageStore } from '@/store/languageStore';
import type { Locale, TranslationKey } from '@/utils/translations';

export function useLanguage() {
  const router = useRouter();
  const { locale, setLocale: setStoreLocale, t: storeT } = useLanguageStore();

  const setLanguage = useCallback(
    async (newLocale: Locale) => {
      setStoreLocale(newLocale);

      try {
        await router.push(router.asPath, router.asPath, { locale: newLocale });
      } catch {
        // Navigation cancelled or failed - store locale is still updated
      }
    },
    [router, setStoreLocale]
  );

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      return storeT(key, params);
    },
    [storeT]
  );

  const toggleLanguage = useCallback(() => {
    const newLocale: Locale = locale === 'th' ? 'en' : 'th';
    setLanguage(newLocale);
  }, [locale, setLanguage]);

  const currentLanguage = locale === 'th' ? 'ไทย' : 'English';
  const currentFlag = locale === 'th' ? '🇹🇭' : '🇬🇧';

  return {
    locale,
    currentLanguage,
    currentFlag,
    setLanguage,
    toggleLanguage,
    t,
  };
}
