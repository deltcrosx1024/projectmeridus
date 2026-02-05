'use client';

import React from 'react';
import { useLanguage } from '@/app/contexts/LanguageContext';
import styles from './LanguageSwitcher.module.css';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={styles.switcher}>
      <button
        onClick={() => setLanguage('en')}
        className={`${styles.btn} ${language === 'en' ? styles.active : ''}`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('ja')}
        className={`${styles.btn} ${language === 'ja' ? styles.active : ''}`}
      >
        JP
      </button>
    </div>
  );
}
