'use client';

import Header from '@/app/components/header/Header';
import Footer from '@/app/components/footer/Footer';
import { useAuth } from '@/app/contexts/AuthContext';
import { useSettingsContext } from '@/app/contexts/SettingsContext';
import { useState, useEffect } from 'react';
import { UserSettings, DEFAULT_SETTINGS } from '@/app/lib/settings';
import DataExport from '@/app/components/export/DataExport';

interface PendingChanges {
  notifications: Partial<Pick<UserSettings, 'webhookNotifications' | 'issueAlerts' | 'commitNotifications'>>;
  repository: Partial<Pick<UserSettings, 'defaultView' | 'autoRefresh' | 'refreshInterval'>>;
  appearance: Partial<Pick<UserSettings, 'compactMode' | 'theme'>>;
}

export default function SettingsPage() {
  const { githubUser, discordUser, logout } = useAuth();
  const { settings, updateSettings, isLoading: settingsLoading } = useSettingsContext();
  const [showGitHubConfirm, setShowGitHubConfirm] = useState(false);
  const [showDiscordConfirm, setShowDiscordConfirm] = useState(false);
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
      <div className="min-h-screen bg-black">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-[#0070F3] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[#A1A1AA]">Loading settings...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-[#A1A1AA]">Manage your account connections and preferences</p>
        </div>

        <div className="space-y-6">
          {/* Connected Services */}
          <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-6">Connected Services</h2>

            {/* GitHub Section */}
            <div className="mb-6 pb-6 border-b border-[#333333]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-[#A1A1AA]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.343-3.369-1.343-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.545 2.91 1.187.092-.923.35-1.545.636-1.9-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.578 9.578 0 0110 4.817c.85.004 1.705.114 2.504.336 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.578.688.48C17.137 18.195 20 14.44 20 10.017 20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-white">GitHub</h3>
                    {githubUser ? (
                      <p className="text-sm text-[#A1A1AA]">Connected as @{githubUser.login}</p>
                    ) : (
                      <p className="text-sm text-[#A1A1AA]">Not connected</p>
                    )}
                  </div>
                </div>
                {githubUser ? (
                  <button onClick={() => setShowGitHubConfirm(true)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                    Disconnect
                  </button>
                ) : (
                  <button disabled className="px-4 py-2 bg-[#333333] text-[#A1A1AA] rounded-lg cursor-not-allowed">Not Connected</button>
                )}
              </div>

              {githubUser && (
                <div className="grid grid-cols-3 gap-4 text-sm text-[#A1A1AA]">
                  <div><p className="text-[#666666]">Repositories</p><p className="text-white font-semibold">{githubUser.public_repos}</p></div>
                  <div><p className="text-[#666666]">Followers</p><p className="text-white font-semibold">{githubUser.followers}</p></div>
                  <div><p className="text-[#666666]">User ID</p><p className="text-white font-semibold">{githubUser.id}</p></div>
                </div>
              )}

              {showGitHubConfirm && (
                <div className="mt-4 p-4 bg-red-900/20 border border-red-900/50 rounded-lg">
                  <p className="text-white mb-3">Are you sure you want to disconnect GitHub?</p>
                  <div className="flex gap-2">
                    <button onClick={() => { logout('github'); setShowGitHubConfirm(false); }} className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded">Yes, Disconnect</button>
                    <button onClick={() => setShowGitHubConfirm(false)} className="px-3 py-2 bg-[#333333] hover:bg-[#1a1a1a] text-white rounded">Cancel</button>
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
                    <h3 className="font-semibold text-white">Discord</h3>
                    {discordUser ? (
                      <p className="text-sm text-[#A1A1AA]">Connected as {discordUser.username}</p>
                    ) : (
                      <p className="text-sm text-[#A1A1AA]">Not connected</p>
                    )}
                  </div>
                </div>
                {discordUser ? (
                  <button onClick={() => setShowDiscordConfirm(true)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">Disconnect</button>
                ) : (
                  <button disabled className="px-4 py-2 bg-[#333333] text-[#A1A1AA] rounded-lg cursor-not-allowed">Not Connected</button>
                )}
              </div>

              {discordUser && (
                <div className="grid grid-cols-3 gap-4 text-sm text-[#A1A1AA]">
                  <div><p className="text-[#666666]">Username</p><p className="text-white font-semibold">{discordUser.username}</p></div>
                  <div><p className="text-[#666666]">User ID</p><p className="text-white font-semibold">{discordUser.id}</p></div>
                  <div><p className="text-[#666666]">Avatar</p><p className="text-white font-semibold">✓ Connected</p></div>
                </div>
              )}

              {showDiscordConfirm && (
                <div className="mt-4 p-4 bg-red-900/20 border border-red-900/50 rounded-lg">
                  <p className="text-white mb-3">Are you sure you want to disconnect Discord?</p>
                  <div className="flex gap-2">
                    <button onClick={() => { logout('discord'); setShowDiscordConfirm(false); }} className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded">Yes, Disconnect</button>
                    <button onClick={() => setShowDiscordConfirm(false)} className="px-3 py-2 bg-[#333333] hover:bg-[#1a1a1a] text-white rounded">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Notifications</h2>
                <p className="text-sm text-[#A1A1AA] mt-1">Configure how you receive updates</p>
              </div>
              {getSectionStatus('notifications')}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-[#333333]">
                <div>
                  <p className="text-white font-medium">Webhook Notifications</p>
                  <p className="text-sm text-[#666666]">Receive Discord alerts for subscribed events</p>
                </div>
                <button onClick={() => handleLocalChange('notifications', 'webhookNotifications', !localSettings.webhookNotifications)} className={`relative w-11 h-6 rounded-full transition-colors ${localSettings.webhookNotifications ? 'bg-[#0070F3]' : 'bg-[#333333]'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${localSettings.webhookNotifications ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-[#333333]">
                <div>
                  <p className="text-white font-medium">Issue Alerts</p>
                  <p className="text-sm text-[#666666]">Get notified when new issues are created</p>
                </div>
                <button onClick={() => handleLocalChange('notifications', 'issueAlerts', !localSettings.issueAlerts)} className={`relative w-11 h-6 rounded-full transition-colors ${localSettings.issueAlerts ? 'bg-[#0070F3]' : 'bg-[#333333]'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${localSettings.issueAlerts ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-white font-medium">Commit Notifications</p>
                  <p className="text-sm text-[#666666]">Receive updates on new commits</p>
                </div>
                <button onClick={() => handleLocalChange('notifications', 'commitNotifications', !localSettings.commitNotifications)} className={`relative w-11 h-6 rounded-full transition-colors ${localSettings.commitNotifications ? 'bg-[#0070F3]' : 'bg-[#333333]'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${localSettings.commitNotifications ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {hasNotificationChanges && (
              <div className="flex gap-2 mt-4">
                <button onClick={() => applyChanges('notifications')} className="px-4 py-2 bg-[#0070F3] hover:bg-[#0060df] text-white rounded-lg">Apply Changes</button>
                <button onClick={() => resetChanges('notifications')} className="px-4 py-2 bg-[#333333] hover:bg-[#1a1a1a] text-white rounded-lg">Cancel</button>
              </div>
            )}
          </div>

          {/* Repository */}
          <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Repository</h2>
                <p className="text-sm text-[#A1A1AA] mt-1">Customize how repositories are displayed</p>
              </div>
              {getSectionStatus('repository')}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-[#333333]">
                <div>
                  <p className="text-white font-medium">Default View</p>
                  <p className="text-sm text-[#666666]">Choose how repositories are displayed</p>
                </div>
                <select value={localSettings.defaultView} onChange={(e) => handleLocalChange('repository', 'defaultView', e.target.value)} className="px-3 py-2 bg-[#0a0a0a] border border-[#333333] rounded-lg text-white text-sm">
                  <option value="grid">Grid</option>
                  <option value="list">List</option>
                  <option value="compact">Compact</option>
                </select>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-[#333333]">
                <div>
                  <p className="text-white font-medium">Auto Refresh</p>
                  <p className="text-sm text-[#666666]">Automatically refresh repository data</p>
                </div>
                <button onClick={() => handleLocalChange('repository', 'autoRefresh', !localSettings.autoRefresh)} className={`relative w-11 h-6 rounded-full transition-colors ${localSettings.autoRefresh ? 'bg-[#0070F3]' : 'bg-[#333333]'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${localSettings.autoRefresh ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {localSettings.autoRefresh && (
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-white font-medium">Refresh Interval</p>
                    <p className="text-sm text-[#666666]">How often to refresh data</p>
                  </div>
                  <select value={localSettings.refreshInterval} onChange={(e) => handleLocalChange('repository', 'refreshInterval', parseInt(e.target.value))} className="px-3 py-2 bg-[#0a0a0a] border border-[#333333] rounded-lg text-white text-sm">
                    <option value="1">1 minute</option>
                    <option value="5">5 minutes</option>
                    <option value="10">10 minutes</option>
                    <option value="30">30 minutes</option>
                  </select>
                </div>
              )}
            </div>

            {hasRepositoryChanges && (
              <div className="flex gap-2 mt-4">
                <button onClick={() => applyChanges('repository')} className="px-4 py-2 bg-[#0070F3] hover:bg-[#0060df] text-white rounded-lg">Apply Changes</button>
                <button onClick={() => resetChanges('repository')} className="px-4 py-2 bg-[#333333] hover:bg-[#1a1a1a] text-white rounded-lg">Cancel</button>
              </div>
            )}
          </div>

          {/* Appearance */}
          <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Appearance</h2>
                <p className="text-sm text-[#A1A1AA] mt-1">Customize the look and feel</p>
              </div>
              {getSectionStatus('appearance')}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-[#333333]">
                <div>
                  <p className="text-white font-medium">Theme</p>
                  <p className="text-sm text-[#666666]">Choose your preferred color scheme</p>
                </div>
                <div className="flex bg-[#1a1a1a] rounded-lg p-1">
                  {['dark', 'light', 'system'].map((theme) => (
                    <button key={theme} onClick={() => handleLocalChange('appearance', 'theme', theme)} className={`px-3 py-1 rounded text-sm capitalize ${localSettings.theme === theme ? 'bg-[#0070F3] text-white' : 'text-[#A1A1AA] hover:text-white'}`}>
                      {theme}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-white font-medium">Compact Mode</p>
                  <p className="text-sm text-[#666666]">Show more content with less spacing</p>
                </div>
                <button onClick={() => handleLocalChange('appearance', 'compactMode', !localSettings.compactMode)} className={`relative w-11 h-6 rounded-full transition-colors ${localSettings.compactMode ? 'bg-[#0070F3]' : 'bg-[#333333]'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${localSettings.compactMode ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {hasAppearanceChanges && (
              <div className="flex gap-2 mt-4">
                <button onClick={() => applyChanges('appearance')} className="px-4 py-2 bg-[#0070F3] hover:bg-[#0060df] text-white rounded-lg">Apply Changes</button>
                <button onClick={() => resetChanges('appearance')} className="px-4 py-2 bg-[#333333] hover:bg-[#1a1a1a] text-white rounded-lg">Cancel</button>
              </div>
            )}
          </div>

          {/* Data Export */}
          <DataExport />

          {/* Clear Data */}
          <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Clear Data</h2>
            <p className="text-sm text-[#A1A1AA] mb-4">Remove all cached repository data and preferences</p>
            
            {!showClearDataConfirm ? (
              <button onClick={() => setShowClearDataConfirm(true)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">Clear All Data</button>
            ) : (
              <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg">
                <p className="text-white mb-3">Are you sure? This will remove all your cached data.</p>
                <div className="flex gap-2">
                  <button onClick={handleClearData} className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded">Yes, Clear</button>
                  <button onClick={() => setShowClearDataConfirm(false)} className="px-3 py-2 bg-[#333333] hover:bg-[#1a1a1a] text-white rounded">Cancel</button>
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
