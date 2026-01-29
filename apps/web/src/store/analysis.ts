import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  MatchResult,
  EnhancedAnalysisResult,
  PolygenicRiskScore,
  TraitAssociation
} from '@genomeforge/types';

interface DatabaseStatus {
  clinvar: { loaded: boolean; count: number; loading: boolean; error: string | null };
  pharmgkb: { loaded: boolean; count: number; loading: boolean; error: string | null };
  gwas: { loaded: boolean; count: number; loading: boolean; error: string | null };
}

interface AnalysisState {
  // Match result from matcher
  matchResult: MatchResult | null;
  // Enhanced analysis with GWAS/PRS data
  enhancedResult: EnhancedAnalysisResult | null;
  // Polygenic risk scores
  polygenicScores: PolygenicRiskScore[];
  // Trait associations from GWAS
  traitAssociations: TraitAssociation[];
  // Database loading status
  databaseStatus: DatabaseStatus;
  // Analysis in progress
  isAnalyzing: boolean;
  analysisProgress: { stage: string; percent: number } | null;
  analysisError: string | null;
  // Actions
  setMatchResult: (result: MatchResult | null) => void;
  setEnhancedResult: (result: EnhancedAnalysisResult | null) => void;
  setPolygenicScores: (scores: PolygenicRiskScore[]) => void;
  setTraitAssociations: (associations: TraitAssociation[]) => void;
  updateDatabaseStatus: (db: keyof DatabaseStatus, status: Partial<DatabaseStatus[keyof DatabaseStatus]>) => void;
  setAnalyzing: (analyzing: boolean) => void;
  setAnalysisProgress: (progress: { stage: string; percent: number } | null) => void;
  setAnalysisError: (error: string | null) => void;
  clearAnalysis: () => void;
}

const initialDatabaseStatus: DatabaseStatus = {
  clinvar: { loaded: false, count: 0, loading: false, error: null },
  pharmgkb: { loaded: false, count: 0, loading: false, error: null },
  gwas: { loaded: false, count: 0, loading: false, error: null }
};

export const useAnalysisStore = create<AnalysisState>()(
  persist(
    (set) => ({
      matchResult: null,
      enhancedResult: null,
      polygenicScores: [],
      traitAssociations: [],
      databaseStatus: initialDatabaseStatus,
      isAnalyzing: false,
      analysisProgress: null,
      analysisError: null,

      setMatchResult: (result) => set({ matchResult: result }),
      setEnhancedResult: (result) => set({ enhancedResult: result }),
      setPolygenicScores: (scores) => set({ polygenicScores: scores }),
      setTraitAssociations: (associations) => set({ traitAssociations: associations }),
      updateDatabaseStatus: (db, status) =>
        set((state) => ({
          databaseStatus: {
            ...state.databaseStatus,
            [db]: { ...state.databaseStatus[db], ...status }
          }
        })),
      setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
      setAnalysisProgress: (analysisProgress) => set({ analysisProgress }),
      setAnalysisError: (analysisError) => set({ analysisError }),
      clearAnalysis: () =>
        set({
          matchResult: null,
          enhancedResult: null,
          polygenicScores: [],
          traitAssociations: [],
          analysisError: null
        })
    }),
    {
      name: 'genomeforge-analysis',
      partialize: (state) => ({
        databaseStatus: state.databaseStatus
      })
    }
  )
);
