'use client';

import Header from '@/app/components/header/Header';
import Footer from '@/app/components/footer/Footer';
import { useAuth } from '@/app/contexts/AuthContext';
import { useSettingsContext } from '@/app/contexts/SettingsContext';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const { githubUser, discordUser, logout } = useAuth();
  const { settings, updateSettings, isLoading: settingsLoading } = useSettingsContext();
  const [showGitHubConfirm, setShowGitHubConfirm] = useState(false);
  const [showDiscordConfirm, setShowDiscordConfirm] = useState(false);
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Local state for toggles (optimistic UI)
  const [localSettings, setLocalSettings] = useState(settings);

  // Sync local settings with context when loaded
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Debounced save function
  const handleSettingChange = async (key: string, value: boolean | string | number) => {
    // Update local state immediately for responsive UI
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setSaveStatus('saving');

    try {
      await updateSettings({ [key]: value });
      setSaveStatus('saved');
      
      // Reset status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      // Revert local state on error
      setLocalSettings(settings);
      
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleClearData = async () => {
    localStorage.clear();
    setShowClearDataConfirm(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <h1 
              className="text-4xl font-bold text-white mb-2"
              style={{ fontFamily: 'var(--font-aldrich)' }}
            >
              Settings
            </h1>
            {saveStatus === 'saving' && (
              <span className="text-sm text-blue-400">Saving...</span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-sm text-green-400">Saved!</span>
            )}
            {saveStatus === 'error' && (
              <span className="text-sm text-red-400">Error saving</span>
            )}
          </div>
          <p className="text-slate-400" style={{ fontFamily: 'var(--font-archivo)' }}>
            Manage your account connections and preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Connected Services */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-6">
            <h2 
              className="text-xl font-bold text-white mb-6"
              style={{ fontFamily: 'var(--font-aldrich)' }}
            >
              Connected Services
            </h2>

            {/* GitHub Section */}
            <div className="mb-6 pb-6 border-b border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.343-3.369-1.343-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.545 2.91 1.187.092-.923.35-1.545.636-1.9-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.578 9.578 0 0110 4.817c.85.004 1.705.114 2.504.336 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.578.688.48C17.137 18.195 20 14.44 20 10.017 20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-white">GitHub</h3>
                    {githubUser ? (
                      <p className="text-sm text-slate-400">Connected as @{githubUser.login}</p>
                    ) : (
                      <p className="text-sm text-slate-400">Not connected</p>
                    )}
                  </div>
                </div>
                {githubUser ? (
                  <button
                    onClick={() => setShowGitHubConfirm(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    disabled
                    className="px-4 py-2 bg-slate-700 text-slate-400 rounded-lg cursor-not-allowed"
                  >
                    Not Connected
                  </button>
                )}
              </div>

              {githubUser && (
                <div className="grid grid-cols-3 gap-4 text-sm text-slate-400">
                  <div>
                    <p className="text-slate-500">Repositories</p>
                    <p className="text-white font-semibold">{githubUser.public_repos}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Followers</p>
                    <p className="text-white font-semibold">{githubUser.followers}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">User ID</p>
                    <p className="text-white font-semibold">{githubUser.id}</p>
                  </div>
                </div>
              )}

              {showGitHubConfirm && (
                <div className="mt-4 p-4 bg-red-900/20 border border-red-900/50 rounded-lg">
                  <p className="text-white mb-3">Are you sure you want to disconnect GitHub?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        logout('github');
                        setShowGitHubConfirm(false);
                      }}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                    >
                      Yes, Disconnect
                    </button>
                    <button
                      onClick={() => setShowGitHubConfirm(false)}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
                    >
                      Cancel
                    </button>
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
                      <p className="text-sm text-slate-400">Connected as {discordUser.username}</p>
                    ) : (
                      <p className="text-sm text-slate-400">Not connected</p>
                    )}
                  </div>
                </div>
                {discordUser ? (
                  <button
                    onClick={() => setShowDiscordConfirm(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    disabled
                    className="px-4 py-2 bg-slate-700 text-slate-400 rounded-lg cursor-not-allowed"
                  >
                    Not Connected
                  </button>
                )}
              </div>

              {discordUser && (
                <div className="grid grid-cols-2 gap-4 text-sm text-slate-400">
                  <div>
                    <p className="text-slate-500">Username</p>
                    <p className="text-white font-semibold">{discordUser.username}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">User ID</p>
                    <p className="text-white font-semibold">{discordUser.id}</p>
                  </div>
                </div>
              )}

              {showDiscordConfirm && (
                <div className="mt-4 p-4 bg-red-900/20 border border-red-900/50 rounded-lg">
                  <p className="text-white mb-3">Are you sure you want to disconnect Discord?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        logout('discord');
                        setShowDiscordConfirm(false);
                      }}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                    >
                      Yes, Disconnect
                    </button>
                    <button
                      onClick={() => setShowDiscordConfirm(false)}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-6">
            <h2 
              className="text-xl font-bold text-white mb-4"
              style={{ fontFamily: 'var(--font-aldrich)' }}
            >
              Notifications
            </h2>
            <p className="text-slate-400 mb-4" style={{ fontFamily: 'var(--font-archivo)' }}>
              Configure how you receive updates from your repositories
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
                <div>
                  <p className="text-white font-medium">Webhook Notifications</p>
                  <p className="text-sm text-slate-500">Receive Discord alerts for subscribed events</p>
                </div>
                <button
                  onClick={() => handleSettingChange('webhookNotifications', !localSettings.webhookNotifications)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    localSettings.webhookNotifications ? 'bg-blue-600' : 'bg-slate-600'
                  }`}
                >
                  <span 
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      localSettings.webhookNotifications ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
                <div>
                  <p className="text-white font-medium">Issue Alerts</p>
                  <p className="text-sm text-slate-500">Get notified when new issues are created</p>
                </div>
                <button
                  onClick={() => handleSettingChange('issueAlerts', !localSettings.issueAlerts)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    localSettings.issueAlerts ? 'bg-blue-600' : 'bg-slate-600'
                  }`}
                >
                  <span 
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      localSettings.issueAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-white font-medium">Commit Notifications</p>
                  <p className="text-sm text-slate-500">Receive updates on new commits</p>
                </div>
                <button
                  onClick={() => handleSettingChange('commitNotifications', !localSettings.commitNotifications)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    localSettings.commitNotifications ? 'bg-blue-600' : 'bg-slate-600'
                  }`}
                >
                  <span 
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      localSettings.commitNotifications ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Repository Preferences */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-6">
            <h2 
              className="text-xl font-bold text-white mb-4"
              style={{ fontFamily: 'var(--font-aldrich)' }}
            >
              Repository Preferences
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
                <div>
                  <p className="text-white font-medium">Default View</p>
                  <p className="text-sm text-slate-500">Choose how repositories are displayed</p>
                </div>
                <select
                  value={localSettings.defaultView}
                  onChange={(e) => handleSettingChange('defaultView', e.target.value)}
                  className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="grid">Grid</option>
                  <option value="list">List</option>
                  <option value="compact">Compact</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
                <div>
                  <p className="text-white font-medium">Auto Refresh</p>
                  <p className="text-sm text-slate-500">Automatically refresh repository data</p>
                </div>
                <button
                  onClick={() => handleSettingChange('autoRefresh', !localSettings.autoRefresh)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    localSettings.autoRefresh ? 'bg-blue-600' : 'bg-slate-600'
                  }`}
                >
                  <span 
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      localSettings.autoRefresh ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              
              {localSettings.autoRefresh && (
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-white font-medium">Refresh Interval</p>
                    <p className="text-sm text-slate-500">How often to refresh data</p>
                  </div>
                  <select
                    value={localSettings.refreshInterval}
                    onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value))}
                    className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value={1}>1 minute</option>
                    <option value={5}>5 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Appearance */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-6">
            <h2 
              className="text-xl font-bold text-white mb-4"
              style={{ fontFamily: 'var(--font-aldrich)' }}
            >
              Appearance
            </h2>
            
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-white font-medium">Compact Mode</p>
                <p className="text-sm text-slate-500">Show more content with less spacing</p>
              </div>
              <button
                onClick={() => handleSettingChange('compactMode', !localSettings.compactMode)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  localSettings.compactMode ? 'bg-blue-600' : 'bg-slate-600'
                }`}
              >
                <span 
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    localSettings.compactMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* API Access */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-6">
            <h2 
              className="text-xl font-bold text-white mb-4"
              style={{ fontFamily: 'var(--font-aldrich)' }}
            >
              API Access
            </h2>
            <p className="text-slate-400 mb-4" style={{ fontFamily: 'var(--font-archivo)' }}>
              Your API keys are securely stored and used for authenticated requests only.
            </p>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-slate-700/50 rounded flex items-center justify-between">
                <div>
                  <p className="text-slate-300 font-medium">GitHub API</p>
                  <p className="text-slate-500 text-xs">Token stored securely in httpOnly cookie</p>
                </div>
                {githubUser ? (
                  <span className="text-green-400 text-xs px-2 py-1 bg-green-900/30 rounded">Active</span>
                ) : (
                  <span className="text-slate-500 text-xs px-2 py-1 bg-slate-700 rounded">Not Connected</span>
                )}
              </div>
              <div className="p-3 bg-slate-700/50 rounded flex items-center justify-between">
                <div>
                  <p className="text-slate-300 font-medium">Discord API</p>
                  <p className="text-slate-500 text-xs">Token stored securely in httpOnly cookie</p>
                </div>
                {discordUser ? (
                  <span className="text-green-400 text-xs px-2 py-1 bg-green-900/30 rounded">Active</span>
                ) : (
                  <span className="text-slate-500 text-xs px-2 py-1 bg-slate-700 rounded">Not Connected</span>
                )}
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-900/10 border border-red-900/30 rounded-lg p-6">
            <h2 
              className="text-xl font-bold text-red-400 mb-4"
              style={{ fontFamily: 'var(--font-aldrich)' }}
            >
              Danger Zone
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-white font-medium">Clear All Data</p>
                  <p className="text-sm text-slate-500">Remove all cached repository data and preferences</p>
                </div>
                <button
                  onClick={() => setShowClearDataConfirm(true)}
                  className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  Clear Data
                </button>
              </div>
              
              {showClearDataConfirm && (
                <div className="p-4 bg-red-900/30 border border-red-900/50 rounded-lg">
                  <p className="text-white mb-3">Are you sure? This will clear all your cached data and cannot be undone.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleClearData}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                    >
                      Yes, Clear Everything
                    </button>
                    <button
                      onClick={() => setShowClearDataConfirm(false)}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
