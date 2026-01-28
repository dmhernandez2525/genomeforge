/**
 * AI Chat Module
 *
 * Provides BYOK (Bring Your Own Key) AI chat integration for GenomeForge.
 * Supports multiple AI providers with context-aware genetic data integration.
 *
 * @packageDocumentation
 */

import type {
  AIProvider,
  AIConfig,
  Message,
  ChatRequest,
  ChatResponse,
  StreamingChunk,
  GeneticContext,
  VariantSummary,
  DrugSummary,
  CarrierSummary,
  TokenUsage,
  IAIProvider
} from '@genomeforge/types';

import type {
  EnhancedAnalysisResult,
  RiskAssessment,
  EnhancedMetabolizerPhenotype,
  EnhancedCarrierStatus
} from '@genomeforge/types';

// ============================================================================
// Constants
// ============================================================================

/** Default AI models for each provider */
export const DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-20250514',
  google: 'gemini-1.5-pro',
  ollama: 'llama3.2'
};

/** Provider API endpoints */
export const PROVIDER_ENDPOINTS: Record<AIProvider, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages',
  google: 'https://generativelanguage.googleapis.com/v1beta/models',
  ollama: 'http://localhost:11434/api/chat'
};

/** Default configuration values */
export const DEFAULT_CONFIG = {
  temperature: 0.7,
  maxTokens: 4096
};

/** System prompt for genetic analysis context */
export const GENETIC_ANALYSIS_SYSTEM_PROMPT = `You are a helpful genetic analysis assistant for GenomeForge, a privacy-first genetic analysis platform. You help users understand their genetic data, including:

- Disease risk assessments based on ClinVar pathogenic variants
- Pharmacogenomics results affecting medication response
- Carrier status for genetic conditions
- Trait associations from GWAS studies
- Polygenic risk scores

IMPORTANT GUIDELINES:
1. Always remind users that genetic findings should be discussed with healthcare providers
2. Never make definitive medical diagnoses
3. Explain genetic concepts in clear, accessible language
4. Be empathetic when discussing sensitive health information
5. Encourage users to consult genetic counselors for serious findings
6. Clarify the limitations of genetic testing when relevant

When answering questions, reference the user's specific genetic context when relevant, but always maintain appropriate medical disclaimers.`;

// ============================================================================
// Types
// ============================================================================

export interface ChatOptions {
  /** System prompt override */
  systemPrompt?: string;
  /** Include genetic context in prompt */
  includeContext?: boolean;
  /** Maximum context length (characters) */
  maxContextLength?: number;
}

export interface AIClientOptions {
  /** Provider configuration */
  config: AIConfig;
  /** Genetic context for the conversation */
  context?: GeneticContext;
  /** Custom fetch function (for testing) */
  fetchFn?: typeof fetch;
}

export interface ValidationResult {
  valid: boolean;
  message: string;
  models?: string[];
}

// ============================================================================
// Genetic Context Builder
// ============================================================================

/**
 * Build genetic context from analysis results
 */
export function buildGeneticContext(
  analysisResult: EnhancedAnalysisResult
): GeneticContext {
  const pathogenicVariants = extractVariantSummaries(analysisResult.riskAssessments);
  const drugInteractions = extractDrugSummaries(analysisResult.metabolizerPhenotypes);
  const carrierStatus = extractCarrierSummaries(analysisResult.carrierStatuses);
  const reportSummary = buildReportSummary(analysisResult);

  return {
    pathogenicVariants,
    drugInteractions,
    carrierStatus,
    reportSummary
  };
}

function extractVariantSummaries(riskAssessments: RiskAssessment[]): VariantSummary[] {
  const summaries: VariantSummary[] = [];

  for (const assessment of riskAssessments) {
    if (assessment.riskLevel === 'high' || assessment.riskLevel === 'moderate') {
      for (const variant of assessment.variants.slice(0, 3)) {
        if (variant.clinvar) {
          summaries.push({
            gene: variant.clinvar.gene,
            condition: assessment.condition,
            significance: variant.clinvar.clinicalSignificance,
            stars: variant.clinvar.reviewStatus
          });
        }
      }
    }
  }

  return summaries.slice(0, 20); // Limit to top 20
}

function extractDrugSummaries(
  phenotypes: EnhancedMetabolizerPhenotype[]
): DrugSummary[] {
  const summaries: DrugSummary[] = [];

  for (const phenotype of phenotypes) {
    for (const drug of phenotype.affectedDrugs.slice(0, 3)) {
      summaries.push({
        gene: phenotype.gene,
        drug: drug.drugName,
        phenotype: phenotype.phenotype,
        recommendation: drug.recommendation.slice(0, 200)
      });
    }
  }

  return summaries.slice(0, 15);
}

function extractCarrierSummaries(
  carriers: EnhancedCarrierStatus[]
): CarrierSummary[] {
  return carriers.slice(0, 10).map(c => ({
    gene: c.gene,
    condition: c.condition
  }));
}

function buildReportSummary(analysisResult: EnhancedAnalysisResult): string {
  const summary = analysisResult.summary;
  const parts: string[] = [];

  if (summary.highRiskCount > 0) {
    parts.push(`${summary.highRiskCount} high-risk genetic finding(s)`);
  }

  if (summary.moderateRiskCount > 0) {
    parts.push(`${summary.moderateRiskCount} moderate-risk finding(s)`);
  }

  if (summary.pharmacogeneCount > 0) {
    parts.push(`${summary.pharmacogeneCount} pharmacogenes affecting drug response`);
  }

  if (summary.carrierCount > 0) {
    parts.push(`carrier status for ${summary.carrierCount} condition(s)`);
  }

  if (summary.traitAssociationCount > 0) {
    parts.push(`${summary.traitAssociationCount} trait associations from GWAS`);
  }

  if (summary.prsCount > 0) {
    parts.push(`${summary.prsCount} polygenic risk scores`);
  }

  if (parts.length === 0) {
    return 'No significant genetic findings identified.';
  }

  return `User's genetic analysis includes: ${parts.join(', ')}.`;
}

/**
 * Format genetic context for inclusion in prompts
 */
export function formatContextForPrompt(
  context: GeneticContext,
  maxLength: number = 2000
): string {
  const sections: string[] = [];

  sections.push(`GENETIC CONTEXT:\n${context.reportSummary}`);

  if (context.pathogenicVariants.length > 0) {
    const variants = context.pathogenicVariants
      .map(v => `- ${v.gene}: ${v.condition} (${v.significance}, ${v.stars} stars)`)
      .join('\n');
    sections.push(`\nPATHOGENIC VARIANTS:\n${variants}`);
  }

  if (context.drugInteractions.length > 0) {
    const drugs = context.drugInteractions
      .map(d => `- ${d.gene} (${d.phenotype}): ${d.drug}`)
      .join('\n');
    sections.push(`\nDRUG INTERACTIONS:\n${drugs}`);
  }

  if (context.carrierStatus.length > 0) {
    const carriers = context.carrierStatus
      .map(c => `- ${c.gene}: ${c.condition}`)
      .join('\n');
    sections.push(`\nCARRIER STATUS:\n${carriers}`);
  }

  let result = sections.join('\n');

  // Truncate if needed
  if (result.length > maxLength) {
    result = result.slice(0, maxLength - 3) + '...';
  }

  return result;
}

// ============================================================================
// AI Provider Implementations
// ============================================================================

/**
 * Abstract base class for AI providers
 */
abstract class BaseAIProvider implements IAIProvider {
  abstract name: AIProvider;
  protected config: AIConfig;
  protected fetchFn: typeof fetch;

  constructor(config: AIConfig, fetchFn: typeof fetch = fetch) {
    this.config = config;
    this.fetchFn = fetchFn;
  }

  abstract validateConnection(): Promise<boolean>;
  abstract complete(request: ChatRequest): Promise<ChatResponse>;
  abstract stream(request: ChatRequest): AsyncGenerator<StreamingChunk, void, unknown>;
  abstract listModels(): Promise<string[]>;

  async isAvailable(): Promise<boolean> {
    try {
      return await this.validateConnection();
    } catch {
      return false;
    }
  }

  protected buildHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json'
    };
  }

  protected getBaseUrl(): string {
    return this.config.baseUrl || PROVIDER_ENDPOINTS[this.name];
  }
}

/**
 * OpenAI provider implementation
 */
export class OpenAIProvider extends BaseAIProvider {
  name: AIProvider = 'openai';

  protected buildHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`
    };
  }

  async validateConnection(): Promise<boolean> {
    const response = await this.fetchFn(`${this.getBaseUrl().replace('/chat/completions', '/models')}`, {
      headers: this.buildHeaders()
    });
    return response.ok;
  }

  async complete(request: ChatRequest): Promise<ChatResponse> {
    const messages = this.prepareMessages(request);

    const response = await this.fetchFn(this.getBaseUrl(), {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify({
        model: this.config.model || DEFAULT_MODELS.openai,
        messages,
        temperature: this.config.temperature ?? DEFAULT_CONFIG.temperature,
        max_tokens: this.config.maxTokens ?? DEFAULT_CONFIG.maxTokens
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || '',
      model: data.model,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      } : undefined,
      finishReason: data.choices[0]?.finish_reason
    };
  }

  async *stream(request: ChatRequest): AsyncGenerator<StreamingChunk, void, unknown> {
    const messages = this.prepareMessages(request);

    const response = await this.fetchFn(this.getBaseUrl(), {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify({
        model: this.config.model || DEFAULT_MODELS.openai,
        messages,
        temperature: this.config.temperature ?? DEFAULT_CONFIG.temperature,
        max_tokens: this.config.maxTokens ?? DEFAULT_CONFIG.maxTokens,
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            yield { content: '', done: true };
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content || '';
            if (content) {
              yield { content, done: false };
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  async listModels(): Promise<string[]> {
    const response = await this.fetchFn(`${this.getBaseUrl().replace('/chat/completions', '/models')}`, {
      headers: this.buildHeaders()
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.data
      ?.filter((m: { id: string }) => m.id.startsWith('gpt'))
      .map((m: { id: string }) => m.id) || [];
  }

  private prepareMessages(request: ChatRequest): Message[] {
    const messages: Message[] = [];

    // Add system message with context
    let systemContent = GENETIC_ANALYSIS_SYSTEM_PROMPT;
    if (request.context) {
      systemContent += '\n\n' + formatContextForPrompt(request.context);
    }
    messages.push({ role: 'system', content: systemContent });

    // Add conversation messages
    messages.push(...request.messages);

    return messages;
  }
}

/**
 * Anthropic provider implementation
 */
export class AnthropicProvider extends BaseAIProvider {
  name: AIProvider = 'anthropic';

  protected buildHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.config.apiKey || '',
      'anthropic-version': '2023-06-01'
    };
  }

  async validateConnection(): Promise<boolean> {
    // Anthropic doesn't have a models endpoint, so we try a minimal request
    try {
      const response = await this.fetchFn(this.getBaseUrl(), {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify({
          model: this.config.model || DEFAULT_MODELS.anthropic,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }]
        })
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async complete(request: ChatRequest): Promise<ChatResponse> {
    const { systemPrompt, messages } = this.prepareMessages(request);

    const response = await this.fetchFn(this.getBaseUrl(), {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify({
        model: this.config.model || DEFAULT_MODELS.anthropic,
        system: systemPrompt,
        messages,
        temperature: this.config.temperature ?? DEFAULT_CONFIG.temperature,
        max_tokens: this.config.maxTokens ?? DEFAULT_CONFIG.maxTokens
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data = await response.json();
    return {
      content: data.content?.[0]?.text || '',
      model: data.model,
      usage: data.usage ? {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens
      } : undefined,
      finishReason: data.stop_reason === 'end_turn' ? 'stop' : data.stop_reason
    };
  }

  async *stream(request: ChatRequest): AsyncGenerator<StreamingChunk, void, unknown> {
    const { systemPrompt, messages } = this.prepareMessages(request);

    const response = await this.fetchFn(this.getBaseUrl(), {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify({
        model: this.config.model || DEFAULT_MODELS.anthropic,
        system: systemPrompt,
        messages,
        temperature: this.config.temperature ?? DEFAULT_CONFIG.temperature,
        max_tokens: this.config.maxTokens ?? DEFAULT_CONFIG.maxTokens,
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta') {
              const content = parsed.delta?.text || '';
              if (content) {
                yield { content, done: false };
              }
            } else if (parsed.type === 'message_stop') {
              yield { content: '', done: true };
              return;
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  async listModels(): Promise<string[]> {
    // Anthropic doesn't have a public models list API
    return [
      'claude-opus-4-20250514',
      'claude-sonnet-4-20250514',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-haiku-20240307'
    ];
  }

  private prepareMessages(request: ChatRequest): { systemPrompt: string; messages: Array<{ role: string; content: string }> } {
    let systemPrompt = GENETIC_ANALYSIS_SYSTEM_PROMPT;
    if (request.context) {
      systemPrompt += '\n\n' + formatContextForPrompt(request.context);
    }

    // Filter out system messages (Anthropic uses separate system field)
    const messages = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role,
        content: m.content
      }));

    return { systemPrompt, messages };
  }
}

/**
 * Google Gemini provider implementation
 */
export class GoogleProvider extends BaseAIProvider {
  name: AIProvider = 'google';

  async validateConnection(): Promise<boolean> {
    const model = this.config.model || DEFAULT_MODELS.google;
    const response = await this.fetchFn(
      `${this.getBaseUrl()}/${model}?key=${this.config.apiKey}`,
      { method: 'GET' }
    );
    return response.ok;
  }

  async complete(request: ChatRequest): Promise<ChatResponse> {
    const model = this.config.model || DEFAULT_MODELS.google;
    const contents = this.prepareContents(request);

    const response = await this.fetchFn(
      `${this.getBaseUrl()}/${model}:generateContent?key=${this.config.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: this.config.temperature ?? DEFAULT_CONFIG.temperature,
            maxOutputTokens: this.config.maxTokens ?? DEFAULT_CONFIG.maxTokens
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google AI API error: ${error}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];

    return {
      content: candidate?.content?.parts?.[0]?.text || '',
      model,
      usage: data.usageMetadata ? {
        promptTokens: data.usageMetadata.promptTokenCount || 0,
        completionTokens: data.usageMetadata.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata.totalTokenCount || 0
      } : undefined,
      finishReason: candidate?.finishReason === 'STOP' ? 'stop' : candidate?.finishReason
    };
  }

  async *stream(request: ChatRequest): AsyncGenerator<StreamingChunk, void, unknown> {
    const model = this.config.model || DEFAULT_MODELS.google;
    const contents = this.prepareContents(request);

    const response = await this.fetchFn(
      `${this.getBaseUrl()}/${model}:streamGenerateContent?key=${this.config.apiKey}&alt=sse`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: this.config.temperature ?? DEFAULT_CONFIG.temperature,
            maxOutputTokens: this.config.maxTokens ?? DEFAULT_CONFIG.maxTokens
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google AI API error: ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        yield { content: '', done: true };
        return;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(line.slice(6));
            const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (content) {
              yield { content, done: false };
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  async listModels(): Promise<string[]> {
    const response = await this.fetchFn(
      `${this.getBaseUrl()}?key=${this.config.apiKey}`,
      { method: 'GET' }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.models?.map((m: { name: string }) => m.name.replace('models/', '')) || [];
  }

  private prepareContents(request: ChatRequest): Array<{ role: string; parts: Array<{ text: string }> }> {
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    // Add context as initial user message if present
    if (request.context) {
      const contextText = `${GENETIC_ANALYSIS_SYSTEM_PROMPT}\n\n${formatContextForPrompt(request.context)}`;
      contents.push({ role: 'user', parts: [{ text: contextText }] });
      contents.push({ role: 'model', parts: [{ text: 'I understand. I\'ll help you with your genetic analysis questions while following the guidelines.' }] });
    }

    // Convert messages (Gemini uses 'model' instead of 'assistant')
    for (const message of request.messages) {
      if (message.role === 'system') continue;
      contents.push({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }]
      });
    }

    return contents;
  }
}

/**
 * Ollama provider implementation (local)
 */
export class OllamaProvider extends BaseAIProvider {
  name: AIProvider = 'ollama';

  async validateConnection(): Promise<boolean> {
    try {
      const response = await this.fetchFn(
        this.getBaseUrl().replace('/api/chat', '/api/tags'),
        { method: 'GET' }
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async complete(request: ChatRequest): Promise<ChatResponse> {
    const messages = this.prepareMessages(request);

    const response = await this.fetchFn(this.getBaseUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model || DEFAULT_MODELS.ollama,
        messages,
        stream: false,
        options: {
          temperature: this.config.temperature ?? DEFAULT_CONFIG.temperature,
          num_predict: this.config.maxTokens ?? DEFAULT_CONFIG.maxTokens
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${error}`);
    }

    const data = await response.json();
    return {
      content: data.message?.content || '',
      model: data.model,
      usage: data.prompt_eval_count !== undefined ? {
        promptTokens: data.prompt_eval_count,
        completionTokens: data.eval_count || 0,
        totalTokens: data.prompt_eval_count + (data.eval_count || 0)
      } : undefined,
      finishReason: data.done ? 'stop' : undefined
    };
  }

  async *stream(request: ChatRequest): AsyncGenerator<StreamingChunk, void, unknown> {
    const messages = this.prepareMessages(request);

    const response = await this.fetchFn(this.getBaseUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model || DEFAULT_MODELS.ollama,
        messages,
        stream: true,
        options: {
          temperature: this.config.temperature ?? DEFAULT_CONFIG.temperature,
          num_predict: this.config.maxTokens ?? DEFAULT_CONFIG.maxTokens
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.done) {
              yield { content: '', done: true };
              return;
            }
            const content = parsed.message?.content || '';
            if (content) {
              yield { content, done: false };
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await this.fetchFn(
        this.getBaseUrl().replace('/api/chat', '/api/tags'),
        { method: 'GET' }
      );

      if (!response.ok) return [];

      const data = await response.json();
      return data.models?.map((m: { name: string }) => m.name) || [];
    } catch {
      return [];
    }
  }

  private prepareMessages(request: ChatRequest): Message[] {
    const messages: Message[] = [];

    // Add system message with context
    let systemContent = GENETIC_ANALYSIS_SYSTEM_PROMPT;
    if (request.context) {
      systemContent += '\n\n' + formatContextForPrompt(request.context);
    }
    messages.push({ role: 'system', content: systemContent });

    // Add conversation messages
    messages.push(...request.messages);

    return messages;
  }
}

// ============================================================================
// AI Client
// ============================================================================

/**
 * Create an AI provider instance
 */
export function createProvider(config: AIConfig, fetchFn?: typeof fetch): IAIProvider {
  const providers: Record<AIProvider, new (config: AIConfig, fetchFn?: typeof fetch) => IAIProvider> = {
    openai: OpenAIProvider,
    anthropic: AnthropicProvider,
    google: GoogleProvider,
    ollama: OllamaProvider
  };

  const ProviderClass = providers[config.provider];
  if (!ProviderClass) {
    throw new Error(`Unknown AI provider: ${config.provider}`);
  }

  return new ProviderClass(config, fetchFn);
}

/**
 * AI Chat Client
 *
 * Manages AI conversations with genetic context.
 */
export class AIClient {
  private provider: IAIProvider;
  private context?: GeneticContext;

  constructor(options: AIClientOptions) {
    this.provider = createProvider(options.config, options.fetchFn);
    this.context = options.context;
  }

  /**
   * Set genetic context for the conversation
   */
  setContext(context: GeneticContext): void {
    this.context = context;
  }

  /**
   * Set context from analysis result
   */
  setContextFromAnalysis(analysisResult: EnhancedAnalysisResult): void {
    this.context = buildGeneticContext(analysisResult);
  }

  /**
   * Validate the AI connection
   */
  async validateConnection(): Promise<ValidationResult> {
    try {
      const valid = await this.provider.validateConnection();
      const models = valid ? await this.provider.listModels() : [];
      return {
        valid,
        message: valid ? 'Connection successful' : 'Connection failed',
        models
      };
    } catch (error) {
      return {
        valid: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send a chat message and get a response
   */
  async chat(messages: Message[], options: ChatOptions = {}): Promise<ChatResponse> {
    const request: ChatRequest = {
      messages,
      config: (this.provider as BaseAIProvider)['config'],
      context: options.includeContext !== false ? this.context : undefined
    };

    return this.provider.complete(request);
  }

  /**
   * Stream a chat response
   */
  async *chatStream(messages: Message[], options: ChatOptions = {}): AsyncGenerator<StreamingChunk, void, unknown> {
    const request: ChatRequest = {
      messages,
      config: (this.provider as BaseAIProvider)['config'],
      context: options.includeContext !== false ? this.context : undefined,
      stream: true
    };

    yield* this.provider.stream(request);
  }

  /**
   * Check if the provider is available
   */
  async isAvailable(): Promise<boolean> {
    return this.provider.isAvailable();
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    return this.provider.listModels();
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create a simple chat function with a provider
 */
export function createChat(config: AIConfig, context?: GeneticContext) {
  const client = new AIClient({ config, context });

  return async (userMessage: string, history: Message[] = []): Promise<string> => {
    const messages: Message[] = [
      ...history,
      { role: 'user', content: userMessage }
    ];

    const response = await client.chat(messages);
    return response.content;
  };
}

/**
 * Quick validation of an API key
 */
export async function validateAPIKey(
  provider: AIProvider,
  apiKey: string,
  baseUrl?: string
): Promise<boolean> {
  const config: AIConfig = {
    provider,
    model: DEFAULT_MODELS[provider],
    apiKey,
    baseUrl
  };

  const providerInstance = createProvider(config);
  return providerInstance.isAvailable();
}

// ============================================================================
// Type Exports
// ============================================================================

export type {
  AIProvider,
  AIConfig,
  Message,
  ChatRequest,
  ChatResponse,
  StreamingChunk,
  GeneticContext,
  TokenUsage,
  IAIProvider
};
