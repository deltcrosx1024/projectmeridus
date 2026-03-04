'use client';

import { useState } from 'react';
import { useGitHubRepos } from '@/app/lib/useGitHub';
import { useGitHubIssues } from '@/app/lib/useGitHub';
import { useAuth } from '@/app/contexts/AuthContext';
import { useSettingsContext } from '@/app/contexts/SettingsContext';

type ExportFormat = 'json' | 'csv';
type ExportType = 'repos' | 'issues' | 'settings' | 'all';

export default function DataExport() {
  const { repos } = useGitHubRepos();
  const { issues } = useGitHubIssues();
  const { githubUser } = useAuth();
  const { settings } = useSettingsContext();
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: unknown[]): string => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0] as Record<string, unknown>);
    const rows = data.map(item => 
      headers.map(header => {
        const value = (item as Record<string, unknown>)[header];
        // Escape values with commas or quotes
        const stringValue = String(value ?? '');
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
  };

  const exportData = async (type: ExportType) => {
    setIsExporting(true);
    
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      
      switch (type) {
        case 'repos':
          if (exportFormat === 'json') {
            const data = {
              exported_at: new Date().toISOString(),
              user: githubUser?.login,
              repositories: repos,
            };
            downloadFile(
              JSON.stringify(data, null, 2),
              `repos-${timestamp}.json`,
              'application/json'
            );
          } else {
            const csv = convertToCSV(repos);
            downloadFile(csv, `repos-${timestamp}.csv`, 'text/csv');
          }
          break;
          
        case 'issues':
          if (exportFormat === 'json') {
            const data = {
              exported_at: new Date().toISOString(),
              user: githubUser?.login,
              issues: issues,
            };
            downloadFile(
              JSON.stringify(data, null, 2),
              `issues-${timestamp}.json`,
              'application/json'
            );
          } else {
            const csv = convertToCSV(issues);
            downloadFile(csv, `issues-${timestamp}.csv`, 'text/csv');
          }
          break;
          
        case 'settings':
          const settingsData = {
            exported_at: new Date().toISOString(),
            user: githubUser?.login,
            settings: settings,
          };
          downloadFile(
            JSON.stringify(settingsData, null, 2),
            `settings-${timestamp}.json`,
            'application/json'
          );
          break;
          
        case 'all':
          const allData = {
            exported_at: new Date().toISOString(),
            user: githubUser?.login,
            repositories: repos,
            issues: issues,
            settings: settings,
          };
          downloadFile(
            JSON.stringify(allData, null, 2),
            `meridus-export-${timestamp}.json`,
            'application/json'
          );
          break;
      }
      
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message: 'Export completed!', type: 'success' } 
      }));
    } catch (error) {
      console.error('Export error:', error);
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message: 'Export failed', type: 'error' } 
      }));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-6">
      <h2 
        className="text-xl font-bold text-white mb-4"
        style={{ fontFamily: 'var(--font-aldrich)' }}
      >
        Data Export
      </h2>
      <p className="text-slate-400 mb-6">
        Download your data in JSON or CSV format for backup or analysis.
      </p>

      {/* Format Selection */}
      <div className="mb-6">
        <label className="text-sm text-slate-300 mb-2 block">Export Format</label>
        <div className="flex gap-2">
          <button
            onClick={() => setExportFormat('json')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              exportFormat === 'json'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            JSON
          </button>
          <button
            onClick={() => setExportFormat('csv')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              exportFormat === 'csv'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            CSV
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {exportFormat === 'json' 
            ? 'JSON format includes all data with nested objects' 
            : 'CSV format is compatible with Excel and other spreadsheet apps'}
        </p>
      </div>

      {/* Export Options */}
      <div className="space-y-3">
        <ExportCard
          title="Repositories"
          description={`${repos.length} repositories`}
          icon={<RepoIcon />}
          onClick={() => exportData('repos')}
          isExporting={isExporting}
          disabled={repos.length === 0}
        />
        
        <ExportCard
          title="Issues"
          description={`${issues.length} issues`}
          icon={<IssueIcon />}
          onClick={() => exportData('issues')}
          isExporting={isExporting}
          disabled={issues.length === 0}
        />
        
        <ExportCard
          title="Settings"
          description="All your preferences and configuration"
          icon={<SettingsIcon />}
          onClick={() => exportData('settings')}
          isExporting={isExporting}
        />
        
        <div className="pt-3 border-t border-slate-700">
          <ExportCard
            title="Export Everything"
            description="Complete backup of all your data"
            icon={<DownloadIcon />}
            onClick={() => exportData('all')}
            isExporting={isExporting}
            primary
          />
        </div>
      </div>
    </div>
  );
}

function ExportCard({ 
  title, 
  description, 
  icon, 
  onClick, 
  isExporting,
  disabled = false,
  primary = false 
}: { 
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  isExporting: boolean;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isExporting || disabled}
      className={`w-full flex items-center gap-4 p-4 rounded-lg transition-all ${
        disabled 
          ? 'opacity-50 cursor-not-allowed bg-slate-800' 
          : primary
            ? 'bg-blue-600/20 border border-blue-600/50 hover:bg-blue-600/30'
            : 'bg-slate-700/50 hover:bg-slate-700'
      }`}
    >
      <div className={`flex-shrink-0 ${primary ? 'text-blue-400' : 'text-slate-400'}`}>
        {icon}
      </div>
      <div className="flex-1 text-left">
        <p className={`font-medium ${primary ? 'text-blue-400' : 'text-white'}`}>{title}</p>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      {isExporting ? (
        <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      )}
    </button>
  );
}

function RepoIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}

function IssueIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.754 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.754 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.754 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.754 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.754 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.754 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.754 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3 3m0 0l-3-3m3 3V8" />
    </svg>
  );
}
