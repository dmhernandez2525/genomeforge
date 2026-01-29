/**
 * useGenomeProcessing Hook
 *
 * Provides a unified interface for genome file parsing and analysis.
 */

import { useState, useCallback } from 'react';
import {
  parseGenomeFile,
  type ParsedGenome,
  type ParseProgress,
} from '@/services/genomeParser';
import {
  analyzeGenome,
  type AnalysisResult,
  type AnalysisProgress,
} from '@/services/genomeAnalysis';
import { useAnalysisStore } from '@/store/analysis';

export interface ProcessingState {
  isProcessing: boolean;
  stage: 'idle' | 'parsing' | 'analyzing' | 'complete' | 'error';
  progress: number;
  message: string;
  error: string | null;
}

export interface ProcessingResult {
  genome: ParsedGenome | null;
  analysis: AnalysisResult | null;
}

export function useGenomeProcessing() {
  const { setGenomeData, setAnalysisResult } = useAnalysisStore();

  const [state, setState] = useState<ProcessingState>({
    isProcessing: false,
    stage: 'idle',
    progress: 0,
    message: '',
    error: null,
  });

  const [result, setResult] = useState<ProcessingResult>({
    genome: null,
    analysis: null,
  });

  const processFile = useCallback(
    async (fileUri: string, filename: string): Promise<ProcessingResult> => {
      setState({
        isProcessing: true,
        stage: 'parsing',
        progress: 0,
        message: 'Reading file...',
        error: null,
      });

      try {
        // Parse the genome file
        const genome = await parseGenomeFile(fileUri, filename, (progress: ParseProgress) => {
          const overallProgress = progress.percentComplete * 0.5; // First 50% is parsing
          setState((prev) => ({
            ...prev,
            progress: Math.round(overallProgress),
            message:
              progress.stage === 'reading'
                ? 'Reading file...'
                : progress.stage === 'parsing'
                ? `Parsing variants... ${progress.variantsParsed.toLocaleString()}`
                : progress.stage === 'indexing'
                ? 'Indexing variants...'
                : 'Finalizing...',
          }));
        });

        setState((prev) => ({
          ...prev,
          stage: 'analyzing',
          progress: 50,
          message: 'Starting analysis...',
        }));

        // Update store with genome data
        setGenomeData({
          source: genome.source,
          filename: genome.metadata.filename,
          variantCount: genome.totalVariants,
          uploadedAt: genome.metadata.parsedAt,
        });

        // Analyze the genome
        const analysis = await analyzeGenome(genome, (progress: AnalysisProgress) => {
          const overallProgress = 50 + progress.percentComplete * 0.5; // Last 50% is analysis
          setState((prev) => ({
            ...prev,
            progress: Math.round(overallProgress),
            message:
              progress.stage === 'clinical'
                ? `Checking clinical database... ${progress.matchesFound} matches`
                : progress.stage === 'pharmacogenomics'
                ? `Checking drug interactions... ${progress.matchesFound} matches`
                : progress.stage === 'traits'
                ? `Checking trait associations... ${progress.matchesFound} matches`
                : 'Generating summary...',
          }));
        });

        // Update store with analysis result
        setAnalysisResult({
          id: analysis.id,
          timestamp: analysis.analyzedAt,
          clinicalVariants: analysis.summary.totalClinicalMatches,
          pharmacogenomicVariants: analysis.summary.totalPgxMatches,
          traitAssociations: analysis.summary.totalTraitAssociations,
        });

        const processingResult = { genome, analysis };
        setResult(processingResult);

        setState({
          isProcessing: false,
          stage: 'complete',
          progress: 100,
          message: 'Processing complete!',
          error: null,
        });

        return processingResult;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Processing failed';
        setState({
          isProcessing: false,
          stage: 'error',
          progress: 0,
          message: '',
          error: errorMessage,
        });
        throw error;
      }
    },
    [setGenomeData, setAnalysisResult]
  );

  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      stage: 'idle',
      progress: 0,
      message: '',
      error: null,
    });
    setResult({
      genome: null,
      analysis: null,
    });
  }, []);

  return {
    state,
    result,
    processFile,
    reset,
  };
}
