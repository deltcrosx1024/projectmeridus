'use client';

import Header from '@/app/components/header/Header';
import Footer from '@/app/components/footer/Footer';
import { useAuth } from '@/app/contexts/AuthContext';
import { useSettingsContext } from '@/app/contexts/SettingsContext';
import { useTheme } from '@/app/contexts/ThemeContext';
import { useState, useEffect } from 'react';
import { UserSettings, DEFAULT_SETTINGS } from '@/app/lib/settings';
import DataExport from '@/app/components/export/DataExport';

interface PendingChanges {
  notifications: Partial<Pick<UserSettings, 'webhookNotifications' | 'issueAlerts' | 'commitNotifications' | 'prAlerts' | 'releaseAlerts' | 'dmNotifications' | 'digestMode'>>;
  repository: Partial<Pick<UserSettings, 'defaultView' | 'autoRefresh' | 'refreshInterval' | 'itemsPerPage'>>;
  appearance: Partial<Pick<UserSettings, 'compactMode' | 'theme'>>;
}

export default function SettingsPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { githubUser, discordUser, vercelUser, logout } = useAuth();
  const { settings, updateSettings, isLoading: settingsLoading } = useSettingsContext();
  const [showGitHubConfirm, setShowGitHubConfirm] = useState(false);
  const [showDiscordConfirm, setShowDiscordConfirm] = useState(false);
  const [showVercelConfirm, setShowVercelConfirm] = useState(false);
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false);
  
  const [localSettings, setLocalSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({
    notifications: {},
    repository: {},
    appearance: {},
  });
  
  const [saveStatus, setSaveStatus] = useState<{
    notifications: 'idle' | 'saving' | 'saved';
    repository: 'idle' | 'saving' | 'saved';
    appearance: 'idle' | 'saving' | 'saved';
  }>({
    notifications: 'idle',
    repository: 'idle',
    appearance: 'idle',
  });

  useEffect(() => {
    if (!settingsLoading && settings) {
      setLocalSettings(settings);
      setPendingChanges({ notifications: {}, repository: {}, appearance: {} });
    }
  }, [settings, settingsLoading]);

  const hasNotificationChanges = Object.keys(pendingChanges.notifications).length > 0;
  const hasRepositoryChanges = Object.keys(pendingChanges.repository).length > 0;
  const hasAppearanceChanges = Object.keys(pendingChanges.appearance).length > 0;

  const handleLocalChange = (
    section: keyof PendingChanges,
    key: string,
    value: boolean | string | number
  ) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setPendingChanges(prev => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  };

  // Apply theme changes immediately
  const handleThemeChange = async (newTheme: 'dark' | 'light' | 'system') => {
    setLocalSettings(prev => ({ 
      ...prev, 
      theme: newTheme as 'dark' | 'light' | 'system'
    }));
    setSaveStatus(prev => ({ ...prev, appearance: 'saving' }));
    try {
      await updateSettings({ theme: newTheme });
      setSaveStatus(prev => ({ ...prev, appearance: 'saved' }));
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, appearance: 'idle' }));
      }, 2000);
    } catch (err) {
      console.error('Failed to update theme:', err);
      setSaveStatus(prev => ({ ...prev, appearance: 'idle' }));
      setLocalSettings(prev => ({ ...prev, theme: settings.theme }));
    }
  };

  // Apply any setting change immediately
  const handleImmediateSave = async (
    section: keyof PendingChanges,
    key: string,
    value: boolean | string | number
  ) => {
    setLocalSettings(prev => {
      const updated = { ...prev, [key]: value };
      return updated as UserSettings;
    });
    setSaveStatus(prev => ({ ...prev, [section]: 'saving' }));
    try {
      await updateSettings({ [key]: value } as Partial<UserSettings>);
      setSaveStatus(prev => ({ ...prev, [section]: 'saved' }));
      setPendingChanges(prev => ({ ...prev, [section]: {} }));
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [section]: 'idle' }));
      }, 2000);
    } catch (err) {
      console.error(`Failed to update ${key}:`, err);
      setSaveStatus(prev => ({ ...prev, [section]: 'idle' }));
      setLocalSettings(prev => ({ ...prev, [key]: settings[key as keyof UserSettings] }));
    }
  };

  const applyChanges = async (section: keyof PendingChanges) => {
    const changes = pendingChanges[section];
    if (Object.keys(changes).length === 0) return;

    setSaveStatus(prev => ({ ...prev, [section]: 'saving' }));

    try {
      await updateSettings(changes);
      setSaveStatus(prev => ({ ...prev, [section]: 'saved' }));
      setPendingChanges(prev => ({ ...prev, [section]: {} }));
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [section]: 'idle' }));
      }, 2000);
    } catch {
      setSaveStatus(prev => ({ ...prev, [section]: 'idle' }));
      setLocalSettings(settings);
    }
  };

  const resetChanges = (section: keyof PendingChanges) => {
    const keys = Object.keys(pendingChanges[section]) as (keyof UserSettings)[];
    setLocalSettings(prev => ({
      ...prev,
      ...keys.reduce((acc, key) => ({ ...acc, [key]: settings[key] }), {}),
    }));
    setPendingChanges(prev => ({ ...prev, [section]: {} }));
  };

  const handleClearData = async () => {
    localStorage.clear();
    setShowClearDataConfirm(false);
    window.location.reload();
  };

  const getSectionStatus = (section: keyof PendingChanges) => {
    const status = saveStatus[section];
    if (status === 'saving') return <span className="text-sm text-blue-400">Saving...</span>;
    if (status === 'saved') return <span className="text-sm text-green-400">Saved!</span>;
    return null;
  };

  if (settingsLoading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[var(--background)]' : 'bg-[var(--background)]'}`}>
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center py-20">
              <div className="text-center">
              <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[var(--muted)]">Loading settings...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[var(--background)] bg-[var(--background)]`}>
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className={`text-4xl font-bold mb-2 text-[var(--foreground)]`}>Settings</h1>
          <p className={`text-[var(--muted)]`}>Manage your account connections and preferences</p>
        </div>

        <div className="space-y-6">
          {/* Connected Services */}
          <div className={`bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6`}>
            <h2 className={`text-xl font-bold mb-6 text-[var(--foreground)]`}>Connected Services</h2>

            {/* GitHub Section */}
            <div className="mb-6 pb-6 border-b border-[var(--card-border)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-[var(--muted)]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.343-3.369-1.343-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.545 2.91 1.187.092-.923.35-1.545.636-1.9-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.578 9.578 0 0110 4.817c.85.004 1.705.114 2.504.336 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.578.688.48C17.137 18.195 20 14.44 20 10.017 20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className={`font-semibold text-[var(--foreground)]`}>GitHub</h3>
                    {githubUser ? (
                      <p className={`text-sm text-[var(--muted)]'}`}>Connected as @{githubUser.login}</p>
                    ) : (
                      <p className={`text-sm text-[var(--muted)]`}>Not connected</p>
                    )}
                  </div>
                </div>
                {githubUser ? (
                  <button onClick={() => setShowGitHubConfirm(true)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-[var(--foreground)] rounded-lg transition-colors">
                    Disconnect
                  </button>
                ) : (
                  <button disabled className="px-4 py-2 bg-[var(--card-border)] text-[var(--muted)] rounded-lg cursor-not-allowed">Not Connected</button>
                )}
              </div>

              {githubUser && (
                <div className="grid grid-cols-3 gap-4 text-sm text-[var(--muted)]">
                  <div><p className="text-[var(--muted)]">Repositories</p><p className="text-[var(--foreground)] font-semibold">{githubUser.public_repos}</p></div>
                  <div><p className="text-[var(--muted)]">Followers</p><p className="text-[var(--foreground)] font-semibold">{githubUser.followers}</p></div>
                  <div><p className="text-[var(--muted)]">User ID</p><p className="text-[var(--foreground)] font-semibold">{githubUser.id}</p></div>
                </div>
              )}

              {showGitHubConfirm && (
                <div className="mt-4 p-4 bg-red-900/20 border border-red-900/50 rounded-lg">
                  <p className="text-[var(--foreground)] mb-3">Are you sure you want to disconnect GitHub?</p>
                  <div className="flex gap-2">
                    <button onClick={() => { logout('github'); setShowGitHubConfirm(false); }} className="px-3 py-2 bg-red-600 hover:bg-red-700 text-[var(--foreground)] rounded">Yes, Disconnect</button>
                    <button onClick={() => setShowGitHubConfirm(false)} className="px-3 py-2 bg-[var(--card-border)] hover:bg-[var(--card-border)]/20 text-[var(--foreground)] rounded">Cancel</button>
                  </div>
                </div>
              )}
            </div>

            {/* Discord Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M16.92 0H3.08A3.08 3.08 0 000 3.08v13.84A3.08 3.08 0 003.08 20h13.84A3.08 3.08 0 0020 16.92V3.08A3.08 3.08 0 0016.92 0zM13.5 13.5a.5.5 0 01-.5.5h-2v-2a.5.5 0 010-1h2a.5.5 0 01.5.5v2.5zm0-4a.5.5 0 01-.5.5h-2v-2a.5.5 0 010-1h2a.5.5 0 01.5.5v2.5zm-4 4a.5.5 0 01-.5.5h-2v-2a.5.5 0 010-1h2a.5.5 0 01.5.5v2.5zm0-4a.5.5 0 01-.5.5h-2v-2a.5.5 0 010-1h2a.5.5 0 01.5.5v2.5z" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">Discord</h3>
                    {discordUser ? (
                      <p className="text-sm text-[var(--muted)]">Connected as {discordUser.username}</p>
                    ) : (
                      <p className="text-sm text-[var(--muted)]">Not connected</p>
                    )}
                  </div>
                </div>
                {discordUser ? (
                  <button onClick={() => setShowDiscordConfirm(true)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-[var(--foreground)] rounded-lg transition-colors">Disconnect</button>
                ) : (
                  <button disabled className="px-4 py-2 bg-[var(--card-border)] text-[var(--muted)] rounded-lg cursor-not-allowed">Not Connected</button>
                )}
              </div>

              {discordUser && (
                <div className="grid grid-cols-3 gap-4 text-sm text-[var(--muted)]">
                  <div><p className="text-[var(--muted)]">Username</p><p className="text-[var(--foreground)] font-semibold">{discordUser.username}</p></div>
                  <div><p className="text-[var(--muted)]">User ID</p><p className="text-[var(--foreground)] font-semibold">{discordUser.id}</p></div>
                  <div><p className="text-[var(--muted)]">Avatar</p><p className="text-[var(--foreground)] font-semibold">✓ Connected</p></div>
                </div>
              )}

              {showDiscordConfirm && (
                <div className="mt-4 p-4 bg-red-900/20 border border-red-900/50 rounded-lg">
                  <p className="text-[var(--foreground)] mb-3">Are you sure you want to disconnect Discord?</p>
                  <div className="flex gap-2">
                    <button onClick={() => { logout('discord'); setShowDiscordConfirm(false); }} className="px-3 py-2 bg-red-600 hover:bg-red-700 text-[var(--foreground)] rounded">Yes, Disconnect</button>
                    <button onClick={() => setShowDiscordConfirm(false)} className="px-3 py-2 bg-[var(--card-border)] hover:bg-[var(--card-border)]/20 text-[var(--foreground)] rounded">Cancel</button>
                  </div>
                </div>
              )}
            </div>

            {/* Vercel Section */}
            <div className="pt-6 border-t border-[var(--card-border)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-[var(--foreground)]" viewBox="0 0 76 76" fill="currentColor">
                    <path d="M38.001 0L0 38.001l38.001 37.999 38-37.999L38.001 0zM38.002 27.587l19.045 19.043-19.045 19.046-19.045-19.046 19.045-19.043zM28.883 28.883L9.747 47.993l-6.04-6.035 19.137-19.075 6.039 6.04z" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">Vercel</h3>
                    {vercelUser ? (
                      <p className="text-sm text-[var(--muted)]">Connected as {vercelUser.username}</p>
                    ) : (
                      <p className="text-sm text-[var(--muted)]">Not connected</p>
                    )}
                  </div>
                </div>
                {vercelUser ? (
                  <button onClick={() => setShowVercelConfirm(true)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-[var(--foreground)] rounded-lg transition-colors">Disconnect</button>
                ) : (
                  <button disabled className="px-4 py-2 bg-[var(--card-border)] text-[var(--muted)] rounded-lg cursor-not-allowed">Not Connected</button>
                )}
              </div>

              {vercelUser && (
                <div className="grid grid-cols-3 gap-4 text-sm text-[var(--muted)]">
                  <div><p className="text-[var(--muted)]">Username</p><p className="text-[var(--foreground)] font-semibold">{vercelUser.username}</p></div>
                  <div><p className="text-[var(--muted)]">Email</p><p className="text-[var(--foreground)] font-semibold">{vercelUser.email}</p></div>
                  <div><p className="text-[var(--muted)]">User ID</p><p className="text-[var(--foreground)] font-semibold">{vercelUser.userId}</p></div>
                </div>
              )}

              {showVercelConfirm && (
                <div className="mt-4 p-4 bg-red-900/20 border border-red-900/50 rounded-lg">
                  <p className="text-[var(--foreground)] mb-3">Are you sure you want to disconnect Vercel?</p>
                  <div className="flex gap-2">
                    <button onClick={() => { logout('vercel'); setShowVercelConfirm(false); }} className="px-3 py-2 bg-red-600 hover:bg-red-700 text-[var(--foreground)] rounded">Yes, Disconnect</button>
                    <button onClick={() => setShowVercelConfirm(false)} className="px-3 py-2 bg-[var(--card-border)] hover:bg-[var(--card-border)]/20 text-[var(--foreground)] rounded">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--foreground)]">Notifications</h2>
                <p className="text-sm text-[var(--muted)] mt-1">Configure how you receive updates</p>
              </div>
              {getSectionStatus('notifications')}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-[var(--card-border)]">
                <div>
                  <p className="text-[var(--foreground)] font-medium">Webhook Notifications</p>
                  <p className="text-sm text-[var(--muted)]">Receive Discord alerts for subscribed events</p>
                </div>
                <button onClick={() => handleImmediateSave('notifications', 'webhookNotifications', !localSettings.webhookNotifications)} className={`relative w-11 h-6 rounded-full transition-colors ${localSettings.webhookNotifications ? 'bg-[var(--accent)]' : 'bg-[var(--card-border)]'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-[var(--background)] rounded-full transition-transform ${localSettings.webhookNotifications ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-[var(--card-border)]">
                <div>
                  <p className="text-[var(--foreground)] font-medium">Issue Alerts</p>
                  <p className="text-sm text-[var(--muted)]">Get notified when new issues are created</p>
                </div>
                <button onClick={() => handleImmediateSave('notifications', 'issueAlerts', !localSettings.issueAlerts)} className={`relative w-11 h-6 rounded-full transition-colors ${localSettings.issueAlerts ? 'bg-[var(--accent)]' : 'bg-[var(--card-border)]'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-[var(--background)] rounded-full transition-transform ${localSettings.issueAlerts ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-[var(--card-border)]">
                <div>
                  <p className="text-[var(--foreground)] font-medium">Pull Request Alerts</p>
                  <p className="text-sm text-[var(--muted)]">Get notified when PRs are opened or updated</p>
                </div>
                <button onClick={() => handleImmediateSave('notifications', 'prAlerts', !localSettings.prAlerts)} className={`relative w-11 h-6 rounded-full transition-colors ${localSettings.prAlerts ? 'bg-[var(--accent)]' : 'bg-[var(--card-border)]'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-[var(--background)] rounded-full transition-transform ${localSettings.prAlerts ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-[var(--card-border)]">
                <div>
                  <p className="text-[var(--foreground)] font-medium">Release Alerts</p>
                  <p className="text-sm text-[var(--muted)]">Get notified when new releases are published</p>
                </div>
                <button onClick={() => handleImmediateSave('notifications', 'releaseAlerts', !localSettings.releaseAlerts)} className={`relative w-11 h-6 rounded-full transition-colors ${localSettings.releaseAlerts ? 'bg-[var(--accent)]' : 'bg-[var(--card-border)]'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-[var(--background)] rounded-full transition-transform ${localSettings.releaseAlerts ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-[var(--card-border)]">
                <div>
                  <p className="text-[var(--foreground)] font-medium">Commit Notifications</p>
                  <p className="text-sm text-[var(--muted)]">Receive updates on new commits</p>
                </div>
                <button onClick={() => handleImmediateSave('notifications', 'commitNotifications', !localSettings.commitNotifications)} className={`relative w-11 h-6 rounded-full transition-colors ${localSettings.commitNotifications ? 'bg-[var(--accent)]' : 'bg-[var(--card-border)]'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-[var(--background)] rounded-full transition-transform ${localSettings.commitNotifications ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-[var(--card-border)]">
                <div>
                  <p className="text-[var(--foreground)] font-medium">DM Notifications</p>
                  <p className="text-sm text-[var(--muted)]">Receive notifications via Discord DM</p>
                </div>
                <button onClick={() => handleImmediateSave('notifications', 'dmNotifications', !localSettings.dmNotifications)} className={`relative w-11 h-6 rounded-full transition-colors ${localSettings.dmNotifications ? 'bg-[var(--accent)]' : 'bg-[var(--card-border)]'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-[var(--background)] rounded-full transition-transform ${localSettings.dmNotifications ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-[var(--foreground)] font-medium">Digest Mode</p>
                  <p className="text-sm text-[var(--muted)]">How often to receive notification summaries</p>
                </div>
                <select value={localSettings.digestMode} onChange={(e) => handleImmediateSave('notifications', 'digestMode', e.target.value)} className="px-3 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] text-sm">
                  <option value="instant">Instant</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                </select>
              </div>
            </div>
          </div>

          {/* Repository */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--foreground)]">Repository</h2>
                <p className="text-sm text-[var(--muted)] mt-1">Customize how repositories are displayed</p>
              </div>
              {getSectionStatus('repository')}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-[var(--card-border)]">
                <div>
                  <p className="text-[var(--foreground)] font-medium">Default View</p>
                  <p className="text-sm text-[var(--muted)]">Choose how repositories are displayed</p>
                </div>
                <select value={localSettings.defaultView} onChange={(e) => handleImmediateSave('repository', 'defaultView', e.target.value)} className="px-3 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] text-sm">
                  <option value="grid">Grid</option>
                  <option value="list">List</option>
                  <option value="compact">Compact</option>
                </select>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-[var(--card-border)]">
                <div>
                  <p className="text-[var(--foreground)] font-medium">Items Per Page</p>
                  <p className="text-sm text-[var(--muted)]">Number of items to show per page</p>
                </div>
                <select value={localSettings.itemsPerPage} onChange={(e) => handleImmediateSave('repository', 'itemsPerPage', Number.parseInt(e.target.value))} className="px-3 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] text-sm">
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-[var(--card-border)]">
                <div>
                  <p className="text-[var(--foreground)] font-medium">Auto Refresh</p>
                  <p className="text-sm text-[var(--muted)]">Automatically refresh repository data</p>
                </div>
                <button onClick={() => handleImmediateSave('repository', 'autoRefresh', !localSettings.autoRefresh)} className={`relative w-11 h-6 rounded-full transition-colors ${localSettings.autoRefresh ? 'bg-[var(--accent)]' : 'bg-[var(--card-border)]'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-[var(--background)] rounded-full transition-transform ${localSettings.autoRefresh ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {localSettings.autoRefresh && (
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-[var(--foreground)] font-medium">Refresh Interval</p>
                    <p className="text-sm text-[var(--muted)]">How often to refresh data</p>
                  </div>
                  <select value={localSettings.refreshInterval} onChange={(e) => handleImmediateSave('repository', 'refreshInterval', parseInt(e.target.value))} className="px-3 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] text-sm">
                    <option value="1">1 minute</option>
                    <option value="5">5 minutes</option>
                    <option value="10">10 minutes</option>
                    <option value="30">30 minutes</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Appearance */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--foreground)]">Appearance</h2>
                <p className="text-sm text-[var(--muted)] mt-1">Customize the look and feel</p>
              </div>
              {getSectionStatus('appearance')}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-[var(--card-border)]">
                <div>
                  <p className="text-[var(--foreground)] font-medium">Theme</p>
                  <p className="text-sm text-[var(--muted)]">Choose your preferred color scheme</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex bg-[var(--card-border)]/20 rounded-lg p-1">
                    {(['dark', 'light'] as const).map((theme) => (
                      <button key={theme} onClick={() => handleThemeChange(theme)} className={`px-3 py-1 rounded text-sm capitalize ${localSettings.theme === theme ? 'bg-[var(--accent)] text-[var(--foreground)]' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}>
                        {theme}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-[var(--foreground)] font-medium text-sm">Quick Toggle:</p>
                    <button onClick={() => {
                        const newTheme = localSettings.theme === 'dark' ? 'light' : 'dark';
                        handleThemeChange(newTheme as 'dark' | 'light' | 'system');
                      }} className="flex items-center gap-2 px-3 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--foreground)] rounded-lg transition-colors text-sm">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.415-1.415l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 01-1 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm-4.464-4.95l-.707-.707a1 1 0 011.414-1.414l.707.707a1 1 0 01-1.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" />
                      </svg>
                      Toggle
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-[var(--foreground)] font-medium">Compact Mode</p>
                  <p className="text-sm text-[var(--muted)]">Show more content with less spacing</p>
                </div>
                <button onClick={() => handleImmediateSave('appearance', 'compactMode', !localSettings.compactMode)} className={`relative w-11 h-6 rounded-full transition-colors ${localSettings.compactMode ? 'bg-[var(--accent)]' : 'bg-[var(--card-border)]'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-[var(--background)] rounded-full transition-transform ${localSettings.compactMode ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Data Export */}
          <DataExport />

          {/* Clear Data */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6">
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">Clear Data</h2>
            <p className="text-sm text-[var(--muted)] mb-4">Remove all cached repository data and preferences</p>
            
            {!showClearDataConfirm ? (
              <button onClick={() => setShowClearDataConfirm(true)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-[var(--foreground)] rounded-lg">Clear All Data</button>
            ) : (
              <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg">
                <p className="text-[var(--foreground)] mb-3">Are you sure? This will remove all your cached data.</p>
                <div className="flex gap-2">
                  <button onClick={handleClearData} className="px-3 py-2 bg-red-600 hover:bg-red-700 text-[var(--foreground)] rounded">Yes, Clear</button>
                  <button onClick={() => setShowClearDataConfirm(false)} className="px-3 py-2 bg-[var(--card-border)] hover:bg-[var(--card-border)]/20 text-[var(--foreground)] rounded">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
