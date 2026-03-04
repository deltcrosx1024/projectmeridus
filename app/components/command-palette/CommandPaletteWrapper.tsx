'use client';

import { useState, useEffect } from 'react';
import CommandPalette from '@/app/components/command-palette/CommandPalette';

export default function CommandPaletteWrapper() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return <CommandPalette isOpen={isOpen} onClose={() => setIsOpen(false)} />;
}
