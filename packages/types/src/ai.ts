/**
 * AI provider type definitions
 * @packageDocumentation
 */

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'ollama';

/**
 * AI provider configuration
 */
export interface AIConfig {
  /** Provider name */
  provider: AIProvider;
  /** Model identifier */
  model: string;
  /** API key (encrypted at rest) */
  apiKey?: string;
  /** Custom base URL (for Ollama or proxy) */
  baseUrl?: string;
  /** Temperature (0-1) */
  temperature?: number;
  /** Maximum response tokens */
  maxTokens?: number;
}

/**
 * Chat message
 */
export interface Message {
  /** Role */
  role: 'system' | 'user' | 'assistant';
  /** Message content */
  content: string;
}

/**
 * Chat request
 */
export interface ChatRequest {
  /** Conversation messages */
  messages: Message[];
  /** AI configuration */
  config: AIConfig;
  /** Genetic context (summarized, not raw data) */
  context?: GeneticContext;
  /** Enable streaming */
  stream?: boolean;
}

/**
 * Chat response
 */
export interface ChatResponse {
  /** Response content */
  content: string;
  /** Model used */
  model: string;
  /** Token usage */
  usage?: TokenUsage;
  /** Finish reason */
  finishReason?: 'stop' | 'length' | 'content_filter';
}

export interface TokenUsage {
  /** Input tokens */
  promptTokens: number;
  /** Output tokens */
  completionTokens: number;
  /** Total tokens */
  totalTokens: number;
}

/**
 * Streaming response chunk
 */
export interface StreamingChunk {
  /** Chunk content */
  content: string;
  /** Whether this is the final chunk */
  done: boolean;
}

// ============================================================================
// Genetic Context (Summarized for AI)
// ============================================================================

/**
 * Summarized genetic context for AI prompts.
 * IMPORTANT: This contains summaries only, never raw genome data.
 */
export interface GeneticContext {
  /** Pathogenic variant summaries */
  pathogenicVariants: VariantSummary[];
  /** Drug interaction summaries */
  drugInteractions: DrugSummary[];
  /** Carrier status summaries */
  carrierStatus: CarrierSummary[];
  /** Overall report summary text */
  reportSummary: string;
}

export interface VariantSummary {
  /** Gene symbol */
  gene: string;
  /** Condition name */
  condition: string;
  /** Clinical significance */
  significance: string;
  /** ClinVar stars */
  stars: number;
}

export interface DrugSummary {
  /** Gene symbol */
  gene: string;
  /** Drug name */
  drug: string;
  /** Metabolizer phenotype */
  phenotype: string;
  /** Dosing recommendation */
  recommendation: string;
}

export interface CarrierSummary {
  /** Gene symbol */
  gene: string;
  /** Condition name */
  condition: string;
}

// ============================================================================
// Conversation Management
// ============================================================================

/**
 * Conversation state
 */
export interface Conversation {
  /** Conversation ID */
  id: string;
  /** Message history */
  messages: Message[];
  /** Genetic context */
  context: GeneticContext;
  /** Creation timestamp */
  createdAt: Date;
  /** Last message timestamp */
  lastMessageAt: Date;
}

// ============================================================================
// Key Management
// ============================================================================

/**
 * Encrypted API key storage
 */
export interface EncryptedData {
  /** Base64 initialization vector */
  iv: string;
  /** Base64 ciphertext */
  ciphertext: string;
  /** Base64 salt for key derivation */
  salt: string;
}

export interface StoredAPIKey {
  /** Provider name */
  provider: AIProvider;
  /** Encrypted key data */
  encrypted: EncryptedData;
  /** Storage timestamp */
  createdAt: Date;
  /** Last usage timestamp */
  lastUsed?: Date;
}

// ============================================================================
// Provider Interface
// ============================================================================

/**
 * AI provider interface
 */
export interface IAIProvider {
  /** Provider name */
  name: AIProvider;

  /** Validate API connection */
  validateConnection(): Promise<boolean>;

  /** Complete a chat request */
  complete(request: ChatRequest): Promise<ChatResponse>;

  /** Stream a chat response */
  stream(request: ChatRequest): AsyncIterable<StreamingChunk>;

  /** List available models */
  listModels(): Promise<string[]>;

  /** Check if provider is available */
  isAvailable(): Promise<boolean>;
}
