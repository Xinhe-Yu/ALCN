'use client';

import { useI18n } from '@/lib/context/I18nContext';

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  const toggleLanguage = () => {
    setLocale(locale === 'en' ? 'zh' : 'en');
  };

  return (
    <div
      onClick={toggleLanguage}
      className="flex items-center border border-transparent text-sm font-medium rounded-md text-amber-600 bg-gray-100 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors cursor-pointer transition-all duration-200 shadow-sm hover:shadow-xs"
    >
      <div
        className={`px-1.5 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${locale === 'en'
          ? 'text-rose-400 bg-white'
          : 'text-gray-500'
          }`}
      >
        A
      </div>
      <div
        className={`px-1.5 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ml-1 ${locale === 'zh'
          ? 'text-rose-400 bg-white'
          : 'text-gray-500'
          }`}
      >
        文
      </div>
    </div>
  );
}
