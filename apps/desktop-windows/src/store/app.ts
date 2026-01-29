import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface DatabaseStatus {
  loaded: boolean;
  count: number;
  loading: boolean;
  error: string | null;
}

interface GenomeData {
  source: string;
  filename: string;
  variantCount: number;
  uploadedAt: string;
}

interface AnalysisResult {
  id: string;
  timestamp: string;
  clinicalVariants: number;
  pharmacogenomicVariants: number;
  traitAssociations: number;
}

interface AppState {
  genomeData: GenomeData | null;
  analysisResult: AnalysisResult | null;
  hasGenomeData: boolean;
  databaseStatus: {
    clinvar: DatabaseStatus;
    pharmgkb: DatabaseStatus;
    gwas: DatabaseStatus;
  };
  setGenomeData: (data: GenomeData) => void;
  setAnalysisResult: (result: AnalysisResult) => void;
  updateDatabaseStatus: (db: 'clinvar' | 'pharmgkb' | 'gwas', status: Partial<DatabaseStatus>) => void;
  clearGenomeData: () => void;
  clearAllData: () => void;
}

const defaultDatabaseStatus: DatabaseStatus = {
  loaded: false,
  count: 0,
  loading: false,
  error: null,
};

const tauriStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const { Store } = await import('@tauri-apps/plugin-store');
      const store = await Store.load('app-data.json');
      return (await store.get<string>(name)) ?? null;
    } catch {
      return localStorage.getItem(name);
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      const { Store } = await import('@tauri-apps/plugin-store');
      const store = await Store.load('app-data.json');
      await store.set(name, value);
      await store.save();
    } catch {
      localStorage.setItem(name, value);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      const { Store } = await import('@tauri-apps/plugin-store');
      const store = await Store.load('app-data.json');
      await store.delete(name);
      await store.save();
    } catch {
      localStorage.removeItem(name);
    }
  },
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      genomeData: null,
      analysisResult: null,
      hasGenomeData: false,
      databaseStatus: {
        clinvar: { ...defaultDatabaseStatus },
        pharmgkb: { ...defaultDatabaseStatus },
        gwas: { ...defaultDatabaseStatus },
      },
      setGenomeData: (data) => set({ genomeData: data, hasGenomeData: true }),
      setAnalysisResult: (result) => set({ analysisResult: result }),
      updateDatabaseStatus: (db, status) =>
        set((state) => ({
          databaseStatus: { ...state.databaseStatus, [db]: { ...state.databaseStatus[db], ...status } },
        })),
      clearGenomeData: () => set({ genomeData: null, analysisResult: null, hasGenomeData: false }),
      clearAllData: () =>
        set({
          genomeData: null,
          analysisResult: null,
          hasGenomeData: false,
          databaseStatus: {
            clinvar: { ...defaultDatabaseStatus },
            pharmgkb: { ...defaultDatabaseStatus },
            gwas: { ...defaultDatabaseStatus },
          },
        }),
    }),
    {
      name: 'genomeforge-app',
      storage: createJSONStorage(() => tauriStorage),
      partialize: (state) => ({ genomeData: state.genomeData, hasGenomeData: state.hasGenomeData, databaseStatus: state.databaseStatus }),
    }
  )
);
