'use client';

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import {
  demoGenomeSummary,
  demoAnalysisSummary,
  demoClinVarVariants,
  demoPharmGKBVariants,
  demoMetabolizerPhenotypes,
  demoCarrierStatuses,
  demoTraitAssociations,
  demoPolygenicScores,
  demoRiskAssessments,
  demoChatMessages,
  demoReportPreview,
  type DemoClinVarVariant,
  type DemoPharmGKBVariant,
  type DemoMetabolizerPhenotype,
  type DemoCarrierStatus,
  type DemoTraitAssociation,
  type DemoPolygenicScore,
  type DemoRiskAssessment,
} from './demoData';

// ============================================================================
// Demo State Types
// ============================================================================

export type DemoTab = 'overview' | 'clinvar' | 'pharmgkb' | 'gwas' | 'prs';
export type DemoPage = 'analysis' | 'reports' | 'chat';

interface DemoChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface DemoState {
  // Navigation
  currentPage: DemoPage;
  activeTab: DemoTab;

  // Analysis state
  isAnalyzing: boolean;
  analysisProgress: { stage: string; percent: number } | null;
  analysisComplete: boolean;

  // Chat state
  chatMessages: DemoChatMessage[];
  isChatLoading: boolean;

  // Report state
  selectedReportType: string | null;
  isGeneratingReport: boolean;

  // Data
  genomeSummary: typeof demoGenomeSummary;
  analysisSummary: typeof demoAnalysisSummary;
  clinvarVariants: DemoClinVarVariant[];
  pharmgkbVariants: DemoPharmGKBVariant[];
  metabolizerPhenotypes: DemoMetabolizerPhenotype[];
  carrierStatuses: DemoCarrierStatus[];
  traitAssociations: DemoTraitAssociation[];
  polygenicScores: DemoPolygenicScore[];
  riskAssessments: DemoRiskAssessment[];
  reportPreview: typeof demoReportPreview | null;
}

interface DemoContextValue extends DemoState {
  // Navigation actions
  setCurrentPage: (page: DemoPage) => void;
  setActiveTab: (tab: DemoTab) => void;

  // Analysis actions
  startAnalysis: () => void;
  resetAnalysis: () => void;

  // Chat actions
  sendChatMessage: (message: string) => void;
  clearChat: () => void;

  // Report actions
  generateReport: (reportType: string) => void;
  clearReport: () => void;
}

// ============================================================================
// Demo Context
// ============================================================================

const DemoContext = createContext<DemoContextValue | undefined>(undefined);

// ============================================================================
// Demo Provider
// ============================================================================

interface DemoProviderProps {
  children: ReactNode;
}

export function DemoProvider({ children }: DemoProviderProps) {
  // State
  const [currentPage, setCurrentPage] = useState<DemoPage>('analysis');
  const [activeTab, setActiveTab] = useState<DemoTab>('overview');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<{ stage: string; percent: number } | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [chatMessages, setChatMessages] = useState<DemoChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportPreview, setReportPreview] = useState<typeof demoReportPreview | null>(null);

  // Simulated analysis with progress
  const startAnalysis = useCallback(() => {
    setIsAnalyzing(true);
    setAnalysisProgress({ stage: 'Initializing...', percent: 0 });
    setAnalysisComplete(false);

    const stages = [
      { stage: 'Loading genome data...', percent: 10 },
      { stage: 'Checking database integrity...', percent: 20 },
      { stage: 'Matching against ClinVar (341K variants)...', percent: 35 },
      { stage: 'Matching against PharmGKB...', percent: 50 },
      { stage: 'Running GWAS association analysis...', percent: 65 },
      { stage: 'Calculating polygenic risk scores...', percent: 80 },
      { stage: 'Generating risk assessments...', percent: 90 },
      { stage: 'Analysis complete!', percent: 100 },
    ];

    let currentStage = 0;
    const interval = setInterval(() => {
      if (currentStage < stages.length) {
        setAnalysisProgress(stages[currentStage]);
        currentStage++;
      } else {
        clearInterval(interval);
        setIsAnalyzing(false);
        setAnalysisProgress(null);
        setAnalysisComplete(true);
      }
    }, 600);
  }, []);

  const resetAnalysis = useCallback(() => {
    setIsAnalyzing(false);
    setAnalysisProgress(null);
    setAnalysisComplete(false);
    setActiveTab('overview');
  }, []);

  // Simulated chat
  const sendChatMessage = useCallback((message: string) => {
    const userMessage: DemoChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, userMessage]);
    setIsChatLoading(true);

    // Simulate AI response delay
    setTimeout(() => {
      const demoResponses: Record<string, string> = {
        default: `Based on your genetic analysis, I can help you understand your results. Your genome shows several notable findings:

1. **Pharmacogenomics**: You're an intermediate metabolizer for CYP2D6 and CYP2C19, which affects how you process many common medications.

2. **Disease Risk**: You carry the HFE variants associated with hereditary hemochromatosis. Regular iron monitoring is recommended.

3. **Carrier Status**: You're a carrier for sickle cell trait and cystic fibrosis.

Would you like me to explain any of these findings in more detail?`,
        warfarin: `Regarding warfarin sensitivity, your genetic profile shows:

**VKORC1**: You carry a variant that makes you more sensitive to warfarin, meaning you would likely need a lower dose than average.

**CYP2C9**: Your intermediate metabolizer status means warfarin is cleared from your body more slowly.

**Combined Effect**: Based on these variants, dosing algorithms suggest you may need 20-40% lower warfarin doses than the standard starting dose.

**Recommendation**: If you ever need to take warfarin, share this genetic information with your healthcare provider. They may want to start you on a lower dose and monitor your INR more frequently initially.`,
        statin: `Your genetic profile indicates increased risk for statin-induced myopathy:

**SLCO1B1**: You carry the *5 variant, which reduces the liver's ability to take up statins, leading to higher blood levels.

**Risk Level**: This variant increases your risk of muscle-related side effects (myopathy) with certain statins, particularly simvastatin.

**Recommendations**:
- Avoid high-dose simvastatin (>20mg)
- Consider alternative statins like rosuvastatin or pravastatin at lower doses
- Report any muscle pain, tenderness, or weakness to your doctor promptly

This information should be shared with any prescribing physician.`,
      };

      let response = demoResponses.default;
      const lowerMessage = message.toLowerCase();

      if (lowerMessage.includes('warfarin') || lowerMessage.includes('blood thinner')) {
        response = demoResponses.warfarin;
      } else if (lowerMessage.includes('statin') || lowerMessage.includes('cholesterol')) {
        response = demoResponses.statin;
      } else if (lowerMessage.includes('cyp2d6') || lowerMessage.includes('metabolizer')) {
        response = demoChatMessages[1].content;
      }

      const assistantMessage: DemoChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };
      setChatMessages(prev => [...prev, assistantMessage]);
      setIsChatLoading(false);
    }, 1500);
  }, []);

  const clearChat = useCallback(() => {
    setChatMessages([]);
  }, []);

  // Simulated report generation
  const generateReport = useCallback((reportType: string) => {
    setSelectedReportType(reportType);
    setIsGeneratingReport(true);
    setReportPreview(null);

    setTimeout(() => {
      setReportPreview(demoReportPreview);
      setIsGeneratingReport(false);
    }, 1500);
  }, []);

  const clearReport = useCallback(() => {
    setSelectedReportType(null);
    setReportPreview(null);
  }, []);

  const value: DemoContextValue = {
    // State
    currentPage,
    activeTab,
    isAnalyzing,
    analysisProgress,
    analysisComplete,
    chatMessages,
    isChatLoading,
    selectedReportType,
    isGeneratingReport,
    genomeSummary: demoGenomeSummary,
    analysisSummary: demoAnalysisSummary,
    clinvarVariants: demoClinVarVariants,
    pharmgkbVariants: demoPharmGKBVariants,
    metabolizerPhenotypes: demoMetabolizerPhenotypes,
    carrierStatuses: demoCarrierStatuses,
    traitAssociations: demoTraitAssociations,
    polygenicScores: demoPolygenicScores,
    riskAssessments: demoRiskAssessments,
    reportPreview,

    // Actions
    setCurrentPage,
    setActiveTab,
    startAnalysis,
    resetAnalysis,
    sendChatMessage,
    clearChat,
    generateReport,
    clearReport,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}
