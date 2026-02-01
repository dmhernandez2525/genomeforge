/**
 * Demo Mode Context Provider
 *
 * Provides demo mode state and functionality throughout the application.
 * When demo mode is enabled, the app uses mock data instead of requiring
 * users to upload their own genome files.
 */

import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  DEMO_DATABASE_STATUS,
  DEMO_ENHANCED_RESULT,
  DEMO_GENOME,
  DEMO_MATCH_RESULT,
  DEMO_POLYGENIC_SCORES,
  DEMO_USERS,
  type DemoRole,
  type DemoUser
} from '../lib/demo-data';
import { useAnalysisStore } from '../store/analysis';
import { useGenomeStore } from '../store/genome';

// ============================================================================
// Types
// ============================================================================

interface DemoContextValue {
  /** Whether demo mode is enabled (from environment variable) */
  isDemoMode: boolean;
  /** Whether demo mode is currently active (user selected a role) */
  isDemoActive: boolean;
  /** Currently selected demo user */
  currentDemoUser: DemoUser | null;
  /** Available demo users */
  demoUsers: DemoUser[];
  /** Activate demo mode with a specific role */
  activateDemo: (role: DemoRole) => void;
  /** Deactivate demo mode and clear demo data */
  deactivateDemo: () => void;
  /** Check if a feature is available for the current demo role */
  hasFeatureAccess: (feature: DemoFeature) => boolean;
}

type DemoFeature =
  | 'raw_data_export'
  | 'detailed_annotations'
  | 'research_tools'
  | 'batch_analysis'
  | 'api_access';

// ============================================================================
// Context
// ============================================================================

const DemoContext = createContext<DemoContextValue | null>(null);

// ============================================================================
// Hook
// ============================================================================

export function useDemoContext(): DemoContextValue {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemoContext must be used within a DemoProvider');
  }
  return context;
}

// ============================================================================
// Provider
// ============================================================================

interface DemoProviderProps {
  children: ReactNode;
}

export function DemoProvider({ children }: DemoProviderProps) {
  // Check if demo mode is enabled via environment variable
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  // Demo state
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [currentDemoUser, setCurrentDemoUser] = useState<DemoUser | null>(null);

  // Store access
  const { setGenome, clear: clearGenome } = useGenomeStore();
  const {
    setMatchResult,
    setEnhancedResult,
    setPolygenicScores,
    setTraitAssociations,
    updateDatabaseStatus,
    clearAnalysis
  } = useAnalysisStore();

  // Internal activation without persisting (used for session restore)
  const activateDemoInternal = useCallback(
    (user: DemoUser) => {
      setCurrentDemoUser(user);
      setIsDemoActive(true);

      // Load demo genome data
      setGenome(DEMO_GENOME);

      // Load demo analysis results
      setMatchResult(DEMO_MATCH_RESULT);
      setEnhancedResult(DEMO_ENHANCED_RESULT);
      setPolygenicScores(DEMO_POLYGENIC_SCORES);
      setTraitAssociations(DEMO_ENHANCED_RESULT.traitAssociations);

      // Set database status
      updateDatabaseStatus('clinvar', DEMO_DATABASE_STATUS.clinvar);
      updateDatabaseStatus('pharmgkb', DEMO_DATABASE_STATUS.pharmgkb);
      updateDatabaseStatus('gwas', DEMO_DATABASE_STATUS.gwas);
    },
    [
      setGenome,
      setMatchResult,
      setEnhancedResult,
      setPolygenicScores,
      setTraitAssociations,
      updateDatabaseStatus
    ]
  );

  // Check for persisted demo session on mount
  useEffect(() => {
    // isDemoMode is a constant from env var, so we check it inline
    if (import.meta.env.VITE_DEMO_MODE !== 'true') return;

    const savedRole = sessionStorage.getItem('genomeforge_demo_role');
    if (savedRole) {
      const user = DEMO_USERS.find((u) => u.role === savedRole);
      if (user) {
        activateDemoInternal(user);
      }
    }
  }, [activateDemoInternal]);

  // Activate demo mode with a specific role
  const activateDemo = useCallback(
    (role: DemoRole) => {
      const user = DEMO_USERS.find((u) => u.role === role);
      if (!user) {
        console.error(`Demo user with role "${role}" not found`);
        return;
      }

      // Persist to session storage
      sessionStorage.setItem('genomeforge_demo_role', role);

      activateDemoInternal(user);
    },
    [activateDemoInternal]
  );

  // Deactivate demo mode
  const deactivateDemo = useCallback(() => {
    setCurrentDemoUser(null);
    setIsDemoActive(false);

    // Clear session storage
    sessionStorage.removeItem('genomeforge_demo_role');

    // Clear all demo data
    clearGenome();
    clearAnalysis();
  }, [clearGenome, clearAnalysis]);

  // Check feature access based on role
  const hasFeatureAccess = useCallback(
    (feature: DemoFeature): boolean => {
      if (!currentDemoUser) return false;

      const researcherFeatures: DemoFeature[] = [
        'raw_data_export',
        'detailed_annotations',
        'research_tools',
        'batch_analysis',
        'api_access'
      ];

      const patientFeatures: DemoFeature[] = ['detailed_annotations'];

      if (currentDemoUser.role === 'researcher') {
        return researcherFeatures.includes(feature);
      }

      if (currentDemoUser.role === 'patient') {
        return patientFeatures.includes(feature);
      }

      return false;
    },
    [currentDemoUser]
  );

  const value: DemoContextValue = {
    isDemoMode,
    isDemoActive,
    currentDemoUser,
    demoUsers: DEMO_USERS,
    activateDemo,
    deactivateDemo,
    hasFeatureAccess
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
