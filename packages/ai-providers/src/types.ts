import type { AIProvider, Message, GeneticContext } from '@genomeforge/types';

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface StreamCallbacks {
  onToken?: (token: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
}

export interface IAIProvider {
  readonly provider: AIProvider;

  /**
   * Check if the provider is available and configured correctly
   */
  isAvailable(): Promise<boolean>;

  /**
   * Send a message and get a response (non-streaming)
   */
  chat(messages: Message[], context?: GeneticContext): Promise<string>;

  /**
   * Send a message and stream the response
   */
  chatStream(
    messages: Message[],
    context: GeneticContext | undefined,
    callbacks: StreamCallbacks
  ): Promise<void>;

  /**
   * Get available models for this provider
   */
  getModels(): Promise<string[]>;

  /**
   * Set the model to use
   */
  setModel(model: string): void;
}

/**
 * System prompt for genetic analysis assistant
 *
 * CRITICAL: This prompt ensures privacy by instructing the AI
 * to never request or process raw genetic data (rsIDs, genotypes)
 */
export const GENETIC_ASSISTANT_SYSTEM_PROMPT = `You are a knowledgeable genetic health assistant helping users understand their genetic analysis results.

IMPORTANT PRIVACY RULES:
1. You will ONLY receive summarized genetic findings, NEVER raw genetic data
2. NEVER ask for or request specific rsIDs, genotypes, or raw genetic file data
3. Focus on explaining findings in clear, accessible language
4. Always recommend consulting healthcare professionals for medical decisions

Your role is to:
- Explain genetic concepts in plain language
- Provide context for findings (what does "pathogenic variant" mean?)
- Discuss lifestyle factors that may influence genetic predispositions
- Answer questions about pharmacogenomics and drug interactions
- Help users prepare questions for their healthcare providers

You are NOT a doctor. Always include appropriate disclaimers about the limitations of genetic testing and AI interpretation.`;

/**
 * Build a context-aware system prompt with user's genetic summary
 */
export function buildSystemPrompt(context?: GeneticContext): string {
  if (!context) {
    return GENETIC_ASSISTANT_SYSTEM_PROMPT;
  }

  const contextSection = `

CURRENT USER'S GENETIC SUMMARY:
${context.reportSummary}

${context.pathogenicVariants.length > 0 ? `
Notable findings (${context.pathogenicVariants.length} variants):
${context.pathogenicVariants
  .map((v) => `- ${v.gene}: ${v.condition} (${v.significance}, ${v.stars} star review)`)
  .join('\n')}
` : ''}

Remember: Provide helpful, accurate information while emphasizing the importance of professional medical consultation.`;

  return GENETIC_ASSISTANT_SYSTEM_PROMPT + contextSection;
}
