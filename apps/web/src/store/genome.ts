import { create } from 'zustand';
import type { ParsedGenome } from '@genomeforge/types';

interface GenomeState {
  genome: ParsedGenome | null;
  isLoading: boolean;
  error: string | null;
  setGenome: (genome: ParsedGenome | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

export const useGenomeStore = create<GenomeState>((set) => ({
  genome: null,
  isLoading: false,
  error: null,
  setGenome: (genome) => set({ genome, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clear: () => set({ genome: null, error: null })
}));
