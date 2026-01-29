import { useState, useCallback, useEffect, useRef } from 'react';
import { useAnalysisStore } from '../store/analysis';

interface DatabaseInfo {
  id: 'clinvar' | 'pharmgkb' | 'gwas';
  name: string;
  description: string;
  sourceUrl: string;
  bundlePlaceholder: string;
  license: string;
}

const databases: DatabaseInfo[] = [
  {
    id: 'clinvar',
    name: 'ClinVar',
    description: 'Clinical significance of genetic variants from NCBI',
    sourceUrl: 'https://ftp.ncbi.nlm.nih.gov/pub/clinvar/',
    bundlePlaceholder: 'https://example.com/bundles/clinvar.json.gz',
    license: 'Public Domain (US Government)'
  },
  {
    id: 'pharmgkb',
    name: 'PharmGKB',
    description: 'Pharmacogenomic associations and drug-gene interactions',
    sourceUrl: 'https://www.pharmgkb.org/downloads',
    bundlePlaceholder: 'https://example.com/bundles/pharmgkb.json.gz',
    license: 'CC BY-SA 4.0'
  },
  {
    id: 'gwas',
    name: 'GWAS Catalog',
    description: 'Genome-wide association study results from EBI',
    sourceUrl: 'https://www.ebi.ac.uk/gwas/docs/file-downloads',
    bundlePlaceholder: 'https://example.com/bundles/gwas.json.gz',
    license: 'CC0 1.0'
  }
];

interface LoadingState {
  isLoading: boolean;
  progress: number;
  stage: string;
  error: string | null;
}

interface DatabaseStats {
  totalRecords: number;
  version?: string;
}

export default function DatabaseManagementPage() {
  const { databaseStatus, updateDatabaseStatus } = useAnalysisStore();

  const [loadingStates, setLoadingStates] = useState<Record<string, LoadingState>>({
    clinvar: { isLoading: false, progress: 0, stage: '', error: null },
    pharmgkb: { isLoading: false, progress: 0, stage: '', error: null },
    gwas: { isLoading: false, progress: 0, stage: '', error: null }
  });

  const [stats, setStats] = useState<Record<string, DatabaseStats>>({});
  const [bundleUrls, setBundleUrls] = useState<Record<string, string>>({
    clinvar: '',
    pharmgkb: '',
    gwas: ''
  });

  const abortControllers = useRef<Record<string, AbortController | null>>({
    clinvar: null,
    pharmgkb: null,
    gwas: null
  });

  // Load database statistics on mount
  useEffect(() => {
    loadDatabaseStats();
  }, []);

  const loadDatabaseStats = useCallback(async () => {
    try {
      const { ClinVarLoader, PharmGKBLoader, GWASLoader } = await import('@genomeforge/databases');

      const [clinvarMeta, pharmgkbMeta, gwasMeta] = await Promise.all([
        ClinVarLoader.getMetadata(),
        PharmGKBLoader.getMetadata(),
        GWASLoader.getMetadata()
      ]);

      const newStats: Record<string, DatabaseStats> = {};
      if (clinvarMeta) {
        newStats.clinvar = { totalRecords: clinvarMeta.recordCount, version: clinvarMeta.version };
      }
      if (pharmgkbMeta) {
        newStats.pharmgkb = { totalRecords: pharmgkbMeta.recordCount, version: pharmgkbMeta.version };
      }
      if (gwasMeta) {
        newStats.gwas = { totalRecords: gwasMeta.recordCount, version: gwasMeta.version };
      }

      setStats(newStats);

      // Update store status
      updateDatabaseStatus('clinvar', {
        loaded: !!clinvarMeta && clinvarMeta.recordCount > 0,
        count: clinvarMeta?.recordCount || 0
      });
      updateDatabaseStatus('pharmgkb', {
        loaded: !!pharmgkbMeta && pharmgkbMeta.recordCount > 0,
        count: pharmgkbMeta?.recordCount || 0
      });
      updateDatabaseStatus('gwas', {
        loaded: !!gwasMeta && gwasMeta.recordCount > 0,
        count: gwasMeta?.recordCount || 0
      });
    } catch (error) {
      console.error('Failed to load database stats:', error);
    }
  }, [updateDatabaseStatus]);

  const handleLoadFromUrl = useCallback(
    async (dbId: 'clinvar' | 'pharmgkb' | 'gwas') => {
      const url = bundleUrls[dbId]?.trim();
      if (!url) {
        setLoadingStates((prev) => ({
          ...prev,
          [dbId]: { isLoading: false, progress: 0, stage: '', error: 'Please enter a valid bundle URL' }
        }));
        return;
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        setLoadingStates((prev) => ({
          ...prev,
          [dbId]: { isLoading: false, progress: 0, stage: '', error: 'Invalid URL format' }
        }));
        return;
      }

      // Create abort controller for cancellation
      abortControllers.current[dbId] = new AbortController();

      setLoadingStates((prev) => ({
        ...prev,
        [dbId]: { isLoading: true, progress: 0, stage: 'Initializing...', error: null }
      }));

      try {
        const { ClinVarLoader, PharmGKBLoader, GWASLoader } = await import('@genomeforge/databases');

        const onProgressNumber = (progress: number) => {
          setLoadingStates((prev) => ({
            ...prev,
            [dbId]: { ...prev[dbId], progress }
          }));
        };

        const onProgressGWAS = (progress: { percentComplete: number; message?: string }) => {
          setLoadingStates((prev) => ({
            ...prev,
            [dbId]: {
              ...prev[dbId],
              progress: progress.percentComplete,
              stage: progress.message || prev[dbId].stage
            }
          }));
        };

        const onStatus = (stage: string) => {
          setLoadingStates((prev) => ({
            ...prev,
            [dbId]: { ...prev[dbId], stage }
          }));
        };

        const abortSignal = abortControllers.current[dbId]?.signal;

        // Load using appropriate loader
        switch (dbId) {
          case 'clinvar': {
            const loader = new ClinVarLoader({
              bundleUrl: url,
              onProgress: onProgressNumber,
              onStatus,
              abortSignal
            });
            await loader.load();
            break;
          }
          case 'pharmgkb': {
            const loader = new PharmGKBLoader({
              bundleUrl: url,
              onProgress: onProgressNumber,
              onStatus,
              abortSignal
            });
            await loader.load();
            break;
          }
          case 'gwas': {
            const gwasLoader = new GWASLoader({
              bundleUrl: url,
              onProgress: onProgressGWAS,
              onStatus,
              abortSignal
            });
            await gwasLoader.loadFromBundle();
            break;
          }
        }

        // Refresh stats after loading
        await loadDatabaseStats();

        setLoadingStates((prev) => ({
          ...prev,
          [dbId]: { isLoading: false, progress: 100, stage: 'Complete!', error: null }
        }));

        // Clear success state after delay
        setTimeout(() => {
          setLoadingStates((prev) => ({
            ...prev,
            [dbId]: { isLoading: false, progress: 0, stage: '', error: null }
          }));
        }, 2000);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          setLoadingStates((prev) => ({
            ...prev,
            [dbId]: { isLoading: false, progress: 0, stage: '', error: 'Loading cancelled' }
          }));
        } else {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load database';
          setLoadingStates((prev) => ({
            ...prev,
            [dbId]: { isLoading: false, progress: 0, stage: '', error: errorMessage }
          }));
        }
      } finally {
        abortControllers.current[dbId] = null;
      }
    },
    [bundleUrls, loadDatabaseStats]
  );

  const handleCancelLoad = useCallback((dbId: 'clinvar' | 'pharmgkb' | 'gwas') => {
    abortControllers.current[dbId]?.abort();
  }, []);

  const handleClearDatabase = useCallback(
    async (dbId: 'clinvar' | 'pharmgkb' | 'gwas') => {
      const dbName = databases.find((d) => d.id === dbId)?.name;
      if (
        !confirm(
          `Are you sure you want to clear the ${dbName} database? You will need to reload it for analysis.`
        )
      ) {
        return;
      }

      try {
        const { ClinVarLoader, PharmGKBLoader, GWASLoader } = await import('@genomeforge/databases');

        switch (dbId) {
          case 'clinvar':
            await ClinVarLoader.clear();
            break;
          case 'pharmgkb':
            await PharmGKBLoader.clear();
            break;
          case 'gwas':
            await GWASLoader.clear();
            break;
        }

        setStats((prev) => {
          const newStats = { ...prev };
          delete newStats[dbId];
          return newStats;
        });

        updateDatabaseStatus(dbId, { loaded: false, count: 0, error: null });
      } catch (error) {
        console.error('Failed to clear database:', error);
      }
    },
    [updateDatabaseStatus]
  );

  const handleClearAll = useCallback(async () => {
    if (
      !confirm(
        'Are you sure you want to clear ALL databases? You will need to reload them for analysis.'
      )
    ) {
      return;
    }

    try {
      const { ClinVarLoader, PharmGKBLoader, GWASLoader } = await import('@genomeforge/databases');

      await Promise.all([ClinVarLoader.clear(), PharmGKBLoader.clear(), GWASLoader.clear()]);

      setStats({});
      updateDatabaseStatus('clinvar', { loaded: false, count: 0, error: null });
      updateDatabaseStatus('pharmgkb', { loaded: false, count: 0, error: null });
      updateDatabaseStatus('gwas', { loaded: false, count: 0, error: null });
    } catch (error) {
      console.error('Failed to clear databases:', error);
    }
  }, [updateDatabaseStatus]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Database Management</h1>
          <p className="mt-2 text-gray-600">
            Load and manage reference databases for genetic analysis.
          </p>
        </div>
        <button
          onClick={handleClearAll}
          className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
        >
          Clear All Databases
        </button>
      </div>

      {/* Overall Status */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="font-semibold text-gray-900">Database Status Overview</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {databases.map((db) => (
            <div
              key={db.id}
              className={`rounded-lg border p-4 ${
                databaseStatus[db.id].loaded
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{db.name}</span>
                {databaseStatus[db.id].loaded ? (
                  <span className="text-xs text-green-600">Loaded</span>
                ) : (
                  <span className="text-xs text-gray-400">Not loaded</span>
                )}
              </div>
              {databaseStatus[db.id].loaded && stats[db.id] && (
                <p className="mt-2 text-sm text-gray-600">
                  {stats[db.id].totalRecords.toLocaleString()} records
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Individual Database Cards */}
      <div className="mt-8 space-y-6">
        {databases.map((db) => (
          <DatabaseCard
            key={db.id}
            database={db}
            status={databaseStatus[db.id]}
            loadingState={loadingStates[db.id]}
            stats={stats[db.id]}
            bundleUrl={bundleUrls[db.id]}
            onBundleUrlChange={(url) => setBundleUrls((prev) => ({ ...prev, [db.id]: url }))}
            onLoad={() => handleLoadFromUrl(db.id)}
            onCancel={() => handleCancelLoad(db.id)}
            onClear={() => handleClearDatabase(db.id)}
          />
        ))}
      </div>

      {/* Instructions */}
      <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h3 className="font-semibold text-blue-800">How to Load Databases</h3>
        <ol className="mt-3 list-decimal list-inside space-y-2 text-sm text-blue-700">
          <li>Obtain a pre-processed database bundle URL (gzipped JSON format)</li>
          <li>Enter the bundle URL in the input field for the database</li>
          <li>Click "Load from URL" to download and process the bundle</li>
          <li>Wait for the processing to complete</li>
        </ol>
        <p className="mt-4 text-xs text-blue-600">
          Note: Database bundles should be hosted on a trusted CDN. The bundle format is a gzipped
          JSON file containing pre-processed variant data optimized for fast loading.
        </p>
      </div>

      {/* Privacy Notice */}
      <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-6">
        <h3 className="font-semibold text-green-800">Privacy & Storage</h3>
        <ul className="mt-2 space-y-1 text-sm text-green-700">
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">&#10003;</span>
            Databases are stored locally in your browser's IndexedDB
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">&#10003;</span>
            Your genetic data is never sent to external servers
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">&#10003;</span>
            Reference data is downloaded once and reused for all analyses
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">&#10003;</span>
            Clearing browser data will remove stored databases
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">&#10003;</span>
            Typical storage: ~100-500MB per database
          </li>
        </ul>
      </div>
    </div>
  );
}

function DatabaseCard({
  database,
  status,
  loadingState,
  stats,
  bundleUrl,
  onBundleUrlChange,
  onLoad,
  onCancel,
  onClear
}: {
  database: DatabaseInfo;
  status: { loaded: boolean; count: number; loading: boolean; error: string | null };
  loadingState: LoadingState;
  stats?: DatabaseStats;
  bundleUrl: string;
  onBundleUrlChange: (url: string) => void;
  onLoad: () => void;
  onCancel: () => void;
  onClear: () => void;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{database.name}</h3>
            <p className="text-sm text-gray-500">{database.description}</p>
          </div>
          <StatusBadge loaded={status.loaded} loading={loadingState.isLoading} />
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {/* Loading Progress */}
        {loadingState.isLoading && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{loadingState.stage}</span>
              <span className="text-sm text-gray-500">{loadingState.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${loadingState.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {loadingState.error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {loadingState.error}
          </div>
        )}

        {/* Stats */}
        {status.loaded && stats && (
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalRecords.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">Total Records</div>
            </div>
            {stats.version && (
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="text-lg font-medium text-gray-900">{stats.version}</div>
                <div className="text-xs text-gray-500">Version</div>
              </div>
            )}
          </div>
        )}

        {/* URL Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Bundle URL</label>
          <input
            type="url"
            value={bundleUrl}
            onChange={(e) => onBundleUrlChange(e.target.value)}
            placeholder={database.bundlePlaceholder}
            disabled={loadingState.isLoading}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:bg-gray-100"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {loadingState.isLoading ? (
            <button
              onClick={onCancel}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={onLoad}
              disabled={!bundleUrl.trim()}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-colors bg-primary-600 text-white hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {status.loaded ? 'Update Database' : 'Load from URL'}
            </button>
          )}

          {status.loaded && !loadingState.isLoading && (
            <button
              onClick={onClear}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Clear
            </button>
          )}

          <a
            href={database.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-sm text-primary-600 hover:underline"
          >
            Original source
          </a>
        </div>

        {/* License Info */}
        <p className="mt-3 text-xs text-gray-400">License: {database.license}</p>
      </div>
    </div>
  );
}

function StatusBadge({ loaded, loading }: { loaded: boolean; loading: boolean }) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        Loading
      </span>
    );
  }

  if (loaded) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
        <span className="w-2 h-2 bg-green-500 rounded-full" />
        Loaded
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
      <span className="w-2 h-2 bg-gray-400 rounded-full" />
      Not Loaded
    </span>
  );
}
