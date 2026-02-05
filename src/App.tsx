import React from 'react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import './styles/fonts.css';

function AppContent() {
  const { language } = useLanguage();

  React.useEffect(() => {
    document.body.setAttribute('data-language', language);
  }, [language]);

  return (
    <div className="app">
      <LanguageSwitcher />
      {/* ...existing code... */}
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}