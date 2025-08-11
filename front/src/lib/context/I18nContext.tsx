'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { NextIntlClientProvider } from 'next-intl';

type Locale = 'en' | 'zh';

interface Messages {
  [key: string]: unknown;
}

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocale] = useState<Locale>('en');
  const [messages, setMessages] = useState<Messages | null>(null);

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'zh')) {
      setLocale(savedLocale);
    } else {
      // First visit - detect browser language
      const browserLanguage = navigator.language || navigator.languages?.[0] || 'en';
      const detectedLocale = browserLanguage.startsWith('zh') ? 'zh' : 'en';
      setLocale(detectedLocale);
      localStorage.setItem('locale', detectedLocale);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('locale', locale);

    import(`../../../messages/${locale}.json`)
      .then((module) => {
        setMessages(module.default);
      })
      .catch((error) => {
        console.error('Error loading messages:', error);
        setMessages({});
      });
  }, [locale]);

  if (!messages) {
    return <div>Loading translations...</div>;
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </I18nContext.Provider>
  );
}
