'use client';

import { useState, useEffect, useCallback } from 'react';

interface Command {
  id: string;
  name: string;
  shortcut?: string;
  action: () => void;
  icon?: React.ReactNode;
}

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [commands, setCommands] = useState<Command[]>([]);

  const registerCommand = useCallback((command: Command) => {
    setCommands(prev => {
      const exists = prev.find(c => c.id === command.id);
      if (exists) return prev.map(c => c.id === command.id ? command : c);
      return [...prev, command];
    });
  }, []);

  const unregisterCommand = useCallback((id: string) => {
    setCommands(prev => prev.filter(c => c.id !== id));
  }, []);

  const openPalette = useCallback(() => setIsOpen(true), []);
  const closePalette = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      // Escape to close
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    openPalette,
    closePalette,
    commands,
    registerCommand,
    unregisterCommand,
  };
}
