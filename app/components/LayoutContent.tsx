'use client';

import { LanguageSwitcher } from './LanguageSwitcher';

export function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LanguageSwitcher />
      {children}
    </>
  );
}
