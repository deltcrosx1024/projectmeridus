'use client';

import { useState, useEffect, useRef } from 'react';

interface Notification {
  id: string;
  type: 'webhook' | 'issue' | 'commit' | 'pr' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: {
    repo?: string;
    url?: string;
  };
}

// Mock notifications for demo - in production, fetch from API/WebSocket
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'pr',
    title: 'New Pull Request',
    message: 'New PR #42 opened in projectmeridus',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    read: false,
    data: { repo: 'projectmeridus', url: 'https://github.com' }
  },
  {
    id: '2',
    type: 'issue',
    title: 'Issue Created',
    message: 'New issue "Bug in login" created',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: false,
    data: { repo: 'projectmeridus' }
  },
  {
    id: '3',
    type: 'commit',
    title: 'New Commit',
    message: '3 new commits pushed to main',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    read: true,
    data: { repo: 'projectmeridus' }
  },
  {
    id: '4',
    type: 'webhook',
    title: 'Discord Connected',
    message: 'Successfully connected to Discord webhook',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: true
  }
];

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function getIconByType(type: Notification['type']) {
  switch (type) {
    case 'pr':
      return (
        <div className="w-8 h-8 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
      );
    case 'issue':
      return (
        <div className="w-8 h-8 rounded-full bg-red-600/20 text-red-400 flex items-center justify-center">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    case 'commit':
      return (
        <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </div>
      );
    case 'webhook':
      return (
        <div className="w-8 h-8 rounded-full bg-green-600/20 text-green-400 flex items-center justify-center">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="w-8 h-8 rounded-full bg-slate-600/20 text-[#A1A1AA] flex items-center justify-center">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
  }
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white hover:text-white transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-[#0a0a0a] border border-[#333333] rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#333333]">
            <h3 className="font-semibold text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-[#A1A1AA] hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-[#666666]">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={`flex gap-3 px-4 py-3 border-b border-[#333333]/50 cursor-pointer hover:bg-[#1a1a1a]/50 transition-colors ${
                    !notification.read ? 'bg-[#1a1a1a]/20' : ''
                  }`}
                >
                  {getIconByType(notification.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`text-sm font-medium ${!notification.read ? 'text-white' : 'text-white'}`}>
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></span>
                      )}
                    </div>
                    <p className="text-sm text-[#A1A1AA] mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-[#666666] mt-1">
                      {formatTimeAgo(notification.timestamp)}
                      {notification.data?.repo && ` • ${notification.data.repo}`}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-[#333333] bg-[#0a0a0a]/50">
            <button className="text-xs text-[#A1A1AA] hover:text-white w-full text-center py-1">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
