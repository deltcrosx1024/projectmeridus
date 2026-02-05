import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="language-switcher">
      <button
        onClick={() => setLanguage('en')}
        className={`lang-btn ${language === 'en' ? 'active' : ''}`}
      >
        English
      </button>
      <button
        onClick={() => setLanguage('ja')}
        className={`lang-btn ${language === 'ja' ? 'active' : ''}`}
      >
        日本語
      </button>
    </div>
  );
}
