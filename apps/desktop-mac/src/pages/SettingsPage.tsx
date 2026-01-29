import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  Database,
  Key,
  Bell,
  Trash2,
  Folder,
  Info,
  Shield,
  Download,
  Upload,
  ExternalLink,
} from 'lucide-react';
import { useAppStore } from '@/store/app';

interface DatabaseStatusData {
  clinvar: { loaded: boolean; record_count: number; last_updated: string | null };
  pharmgkb: { loaded: boolean; record_count: number; last_updated: string | null };
  gwas: { loaded: boolean; record_count: number; last_updated: string | null };
}

export default function SettingsPage() {
  const { hasGenomeData, genomeData, databaseStatus, clearAllData } = useAppStore();
  const [appVersion, setAppVersion] = useState('');
  const [dbStatus, setDbStatus] = useState<DatabaseStatusData | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    invoke<string>('get_app_version').then(setAppVersion);
    invoke<DatabaseStatusData>('get_database_status').then(setDbStatus);
  }, []);

  const handleClearData = () => {
    clearAllData();
    setShowClearConfirm(false);
  };

  const loadedDatabases = Object.values(databaseStatus).filter((s) => s.loaded).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Settings</h1>

      {/* Storage Info */}
      <div className="card-mac p-4 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
            <Folder className="text-primary-600" size={20} />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Local Storage
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {hasGenomeData ? '1' : '0'}
            </div>
            <div className="text-sm text-gray-500">DNA Files</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">0</div>
            <div className="text-sm text-gray-500">Reports</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{loadedDatabases}</div>
            <div className="text-sm text-gray-500">Databases</div>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
          Security
        </h2>
        <div className="card-mac divide-y divide-gray-100 dark:divide-gray-800">
          <button className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="w-9 h-9 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Key className="text-purple-600" size={18} />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-gray-800 dark:text-white">API Keys</div>
              <div className="text-sm text-gray-500">
                Manage your AI provider API keys
              </div>
            </div>
            <ExternalLink className="text-gray-400" size={18} />
          </button>
        </div>
      </section>

      {/* Data Management Section */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
          Data Management
        </h2>
        <div className="card-mac divide-y divide-gray-100 dark:divide-gray-800">
          <button className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="w-9 h-9 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Download className="text-green-600" size={18} />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-gray-800 dark:text-white">Export Data</div>
              <div className="text-sm text-gray-500">
                Create an encrypted backup of your data
              </div>
            </div>
            <ExternalLink className="text-gray-400" size={18} />
          </button>

          <button className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Upload className="text-blue-600" size={18} />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-gray-800 dark:text-white">Import Data</div>
              <div className="text-sm text-gray-500">
                Restore from a backup file
              </div>
            </div>
            <ExternalLink className="text-gray-400" size={18} />
          </button>

          <button className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="w-9 h-9 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Database className="text-orange-600" size={18} />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-gray-800 dark:text-white">
                Reference Databases
              </div>
              <div className="text-sm text-gray-500">
                {loadedDatabases}/3 databases loaded
              </div>
            </div>
            <ExternalLink className="text-gray-400" size={18} />
          </button>

          <button
            className="w-full p-4 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
            onClick={() => setShowClearConfirm(true)}
          >
            <div className="w-9 h-9 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <Trash2 className="text-red-600" size={18} />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-red-600">Clear All Data</div>
              <div className="text-sm text-gray-500">
                Remove all genetic data and settings
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* Preferences Section */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
          Preferences
        </h2>
        <div className="card-mac divide-y divide-gray-100 dark:divide-gray-800">
          <button className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Bell className="text-blue-600" size={18} />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-gray-800 dark:text-white">Notifications</div>
              <div className="text-sm text-gray-500">
                Manage notification preferences
              </div>
            </div>
            <ExternalLink className="text-gray-400" size={18} />
          </button>
        </div>
      </section>

      {/* About Section */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">About</h2>
        <div className="card-mac divide-y divide-gray-100 dark:divide-gray-800">
          <div className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <Info className="text-gray-600" size={18} />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-800 dark:text-white">Version</div>
              <div className="text-sm text-gray-500">{appVersion || '0.1.0'}</div>
            </div>
          </div>

          <button className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="w-9 h-9 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Shield className="text-green-600" size={18} />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-gray-800 dark:text-white">Privacy Policy</div>
            </div>
            <ExternalLink className="text-gray-400" size={18} />
          </button>
        </div>
      </section>

      {/* Privacy Badge */}
      <div className="text-center text-sm text-gray-500">
        <p>GenomeForge v{appVersion || '0.1.0'}</p>
        <p>Made with privacy in mind</p>
      </div>

      {/* Clear Data Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card-mac p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Clear All Data?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This will delete all your genetic data, analysis results, reports, and settings.
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button className="btn-mac" onClick={() => setShowClearConfirm(false)}>
                Cancel
              </button>
              <button
                className="btn-mac bg-red-600 text-white border-red-700 hover:bg-red-700"
                onClick={handleClearData}
              >
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
