import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

interface DatabaseStatus {
  loaded: boolean;
  count: number;
  loading: boolean;
  error: string | null;
}

interface AnalysisStore {
  // State
  genomeData: GenomeData | null;
  analysisResult: AnalysisResult | null;
  hasGenomeData: boolean;
  databaseStatus: {
    clinvar: DatabaseStatus;
    pharmgkb: DatabaseStatus;
    gwas: DatabaseStatus;
  };

  // Actions
  setGenomeData: (data: GenomeData) => void;
  setAnalysisResult: (result: AnalysisResult) => void;
  updateDatabaseStatus: (
    db: 'clinvar' | 'pharmgkb' | 'gwas',
    status: Partial<DatabaseStatus>
  ) => void;
  clearGenomeData: () => void;
  clearAllData: () => void;
}

const defaultDatabaseStatus: DatabaseStatus = {
  loaded: false,
  count: 0,
  loading: false,
  error: null,
};

export const useAnalysisStore = create<AnalysisStore>()(
  persist(
    (set) => ({
      // Initial State
      genomeData: null,
      analysisResult: null,
      hasGenomeData: false,
      databaseStatus: {
        clinvar: { ...defaultDatabaseStatus },
        pharmgkb: { ...defaultDatabaseStatus },
        gwas: { ...defaultDatabaseStatus },
      },

      // Actions
      setGenomeData: (data) =>
        set({
          genomeData: data,
          hasGenomeData: true,
        }),

      setAnalysisResult: (result) =>
        set({
          analysisResult: result,
        }),

      updateDatabaseStatus: (db, status) =>
        set((state) => ({
          databaseStatus: {
            ...state.databaseStatus,
            [db]: {
              ...state.databaseStatus[db],
              ...status,
            },
          },
        })),

      clearGenomeData: () =>
        set({
          genomeData: null,
          analysisResult: null,
          hasGenomeData: false,
        }),

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
      name: 'genomeforge-analysis',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        genomeData: state.genomeData,
        hasGenomeData: state.hasGenomeData,
        databaseStatus: state.databaseStatus,
      }),
    }
  )
);
