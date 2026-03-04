'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Command {
  id: string;
  name: string;
  shortcut?: string;
  action: () => void;
  category?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const defaultCommands: Command[] = [
  { id: 'home', name: 'Go to Home', shortcut: 'g h', action: () => {}, category: 'Navigation' },
  { id: 'repos', name: 'Go to Repositories', shortcut: 'g r', action: () => {}, category: 'Navigation' },
  { id: 'insights', name: 'Go to Insights', shortcut: 'g i', action: () => {}, category: 'Navigation' },
  { id: 'settings', name: 'Go to Settings', shortcut: 'g s', action: () => {}, category: 'Navigation' },
  { id: 'docs', name: 'Go to API Docs', shortcut: 'g d', action: () => {}, category: 'Navigation' },
  { id: 'refresh', name: 'Refresh Data', shortcut: 'r', action: () => {}, category: 'Actions' },
  { id: 'theme', name: 'Toggle Theme', shortcut: 't', action: () => {}, category: 'Actions' },
  { id: 'compact', name: 'Toggle Compact Mode', shortcut: 'c', action: () => {}, category: 'Actions' },
  { id: 'search', name: 'Search Repositories...', shortcut: '/', action: () => {}, category: 'Actions' },
  { id: 'github', name: 'Open GitHub Profile', action: () => {}, category: 'External' },
];

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = defaultCommands.map(cmd => ({
    ...cmd,
    action: () => {
      switch (cmd.id) {
        case 'home':
          router.push('/');
          break;
        case 'repos':
          router.push('/repositories');
          break;
        case 'insights':
          router.push('/insights');
          break;
        case 'settings':
          router.push('/settings');
          break;
        case 'docs':
          router.push('/docs/api');
          break;
        case 'refresh':
          window.location.reload();
          break;
        case 'theme':
          document.documentElement.classList.toggle('light');
          break;
        case 'compact':
          // Dispatch custom event for compact mode toggle
          window.dispatchEvent(new CustomEvent('toggle-compact'));
          break;
        case 'search':
          window.dispatchEvent(new CustomEvent('focus-search'));
          break;
        case 'github':
          window.open('https://github.com', '_blank');
          break;
      }
      onClose();
    },
  }));

  const filteredCommands = search.trim() === '' 
    ? commands 
    : commands.filter(cmd => 
        cmd.name.toLowerCase().includes(search.toLowerCase()) ||
        cmd.category?.toLowerCase().includes(search.toLowerCase())
      );

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    const category = cmd.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {
        // Quick shortcuts when palette is closed
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        
        if (e.key === 'g') {
          const handler = (ev: KeyboardEvent) => {
            switch (ev.key) {
              case 'h': router.push('/'); break;
              case 'r': router.push('/repositories'); break;
              case 'i': router.push('/insights'); break;
              case 's': router.push('/settings'); break;
              case 'd': router.push('/docs/api'); break;
            }
            window.removeEventListener('keydown', handler);
          };
          window.addEventListener('keydown', handler);
          setTimeout(() => window.removeEventListener('keydown', handler), 500);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          filteredCommands[selectedIndex]?.action();
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, router, onClose]);

  if (!isOpen) return null;

  let commandIndex = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center px-4 py-3 border-b border-slate-700">
          <svg className="w-5 h-5 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-white placeholder-slate-400 outline-none text-lg"
          />
          <kbd className="px-2 py-1 text-xs bg-slate-800 text-slate-400 rounded">ESC</kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {Object.entries(groupedCommands).map(([category, cmds]) => (
            <div key={category}>
              <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-800/50">
                {category}
              </div>
              {cmds.map((cmd) => {
                const index = commandIndex++;
                const isSelected = index === selectedIndex;
                
                return (
                  <button
                    key={cmd.id}
                    onClick={cmd.action}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${
                      isSelected ? 'bg-blue-600/20 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{cmd.name}</span>
                    {cmd.shortcut && (
                      <div className="flex items-center gap-1">
                        {cmd.shortcut.split(' ').map((key, i) => (
                          <kbd key={i} className="px-1.5 py-0.5 text-xs bg-slate-800 text-slate-400 rounded">
                            {key === 'g' ? '⌘' : key.toUpperCase()}
                          </kbd>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          
          {filteredCommands.length === 0 && (
            <div className="px-4 py-8 text-center text-slate-500">
              No commands found
            </div>
          )}
        </div>

        <div className="px-4 py-2 text-xs text-slate-500 border-t border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">↑↓</kbd> to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">↵</kbd> to select
            </span>
          </div>
          <span>{filteredCommands.length} commands</span>
        </div>
      </div>
    </div>
  );
}
