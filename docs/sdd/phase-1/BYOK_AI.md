# Software Design Document: BYOK AI Integration

**Feature:** Bring Your Own Key AI Integration
**Package:** `@genomeforge/ai-providers`
**Phase:** 1 (MVP)
**Status:** Planned

---

## 1. Overview

### 1.1 Purpose
Enable users to connect their own AI API keys (OpenAI, Anthropic, Google) or use local models (Ollama) for genetic data interpretation. This ensures:
1. User controls AI costs
2. User controls model selection
3. Raw genetic data never sent to AI providers
4. 100% offline option with Ollama

### 1.2 Scope
- Unified provider interface for 4 AI backends
- Secure API key storage (AES-256-GCM)
- Structured prompt generation (no raw genome data)
- Streaming response support
- Conversation history management

### 1.3 Supported Providers

| Provider | Models | Streaming | Local |
|----------|--------|-----------|-------|
| OpenAI | GPT-4, GPT-4o, GPT-4o-mini | Yes | No |
| Anthropic | Claude 3.5 Sonnet, Claude 3 Opus | Yes | No |
| Google | Gemini 1.5 Pro, Gemini 1.5 Flash | Yes | No |
| Ollama | BioMistral-7B, Llama 3, etc. | Yes | Yes |

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI Provider Layer                            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   AIProviderFactory                       │   │
│  │                                                           │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │   │
│  │  │ OpenAI  │ │Anthropic│ │ Google  │ │ Ollama  │        │   │
│  │  │Provider │ │Provider │ │Provider │ │Provider │        │   │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘        │   │
│  │       └───────────┴──────────┴───────────┘               │   │
│  │                        │                                  │   │
│  │                        ▼                                  │   │
│  │              ┌─────────────────┐                         │   │
│  │              │ IAIProvider     │ (interface)             │   │
│  │              └─────────────────┘                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                             │                                    │
│  ┌──────────────────────────▼───────────────────────────────┐   │
│  │                  PromptBuilder                            │   │
│  │  • Context injection (no raw genome)                      │   │
│  │  • Report summaries                                       │   │
│  │  • Conversation history                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                             │                                    │
│  ┌──────────────────────────▼───────────────────────────────┐   │
│  │                  KeyManager                               │   │
│  │  • AES-256-GCM encryption                                 │   │
│  │  • PBKDF2 key derivation                                  │   │
│  │  • Secure storage (IndexedDB/SecureStore)                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
User Query → PromptBuilder → Provider → AI API → Streaming Response → UI
                  ↑
            MatchResult (not raw genome)
```

---

## 3. Type Definitions

```typescript
// packages/types/src/ai.ts

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'ollama';

export interface AIConfig {
  provider: AIProvider;
  model: string;
  apiKey?: string;          // Encrypted, not for Ollama
  baseUrl?: string;         // Custom endpoint or Ollama URL
  temperature?: number;     // 0-1, default 0.7
  maxTokens?: number;       // Max response length
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: Message[];
  config: AIConfig;
  context?: GeneticContext;  // Summarized, not raw data
  stream?: boolean;
}

export interface ChatResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: 'stop' | 'length' | 'content_filter';
}

export interface StreamingChunk {
  content: string;
  done: boolean;
}

export interface GeneticContext {
  // Summarized findings, NOT raw genome data
  pathogenicVariants: VariantSummary[];
  drugInteractions: DrugSummary[];
  carrierStatus: CarrierSummary[];
  reportSummary: string;
}

export interface VariantSummary {
  gene: string;
  condition: string;
  significance: string;
  stars: number;
}

export interface DrugSummary {
  gene: string;
  drug: string;
  phenotype: string;
  recommendation: string;
}
```

---

## 4. Provider Interface

### 4.1 Abstract Interface

```typescript
// packages/ai-providers/src/types.ts

export interface IAIProvider {
  name: AIProvider;

  // Test connection and validate API key
  validateConnection(): Promise<boolean>;

  // Single message completion
  complete(request: ChatRequest): Promise<ChatResponse>;

  // Streaming completion
  stream(request: ChatRequest): AsyncIterable<StreamingChunk>;

  // List available models
  listModels(): Promise<string[]>;

  // Check if provider is available (for Ollama)
  isAvailable(): Promise<boolean>;
}
```

### 4.2 OpenAI Implementation

```typescript
// packages/ai-providers/src/openai.ts

import OpenAI from 'openai';

export class OpenAIProvider implements IAIProvider {
  name: AIProvider = 'openai';
  private client: OpenAI;

  constructor(apiKey: string, baseUrl?: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: baseUrl,
      dangerouslyAllowBrowser: true  // Keys are user-provided
    });
  }

  async validateConnection(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }

  async complete(request: ChatRequest): Promise<ChatResponse> {
    const response = await this.client.chat.completions.create({
      model: request.config.model,
      messages: this.formatMessages(request),
      temperature: request.config.temperature ?? 0.7,
      max_tokens: request.config.maxTokens ?? 2048
    });

    return {
      content: response.choices[0]?.message?.content ?? '',
      model: response.model,
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      } : undefined,
      finishReason: response.choices[0]?.finish_reason as any
    };
  }

  async *stream(request: ChatRequest): AsyncIterable<StreamingChunk> {
    const stream = await this.client.chat.completions.create({
      model: request.config.model,
      messages: this.formatMessages(request),
      temperature: request.config.temperature ?? 0.7,
      max_tokens: request.config.maxTokens ?? 2048,
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content ?? '';
      const done = chunk.choices[0]?.finish_reason !== null;
      yield { content, done };
    }
  }

  async listModels(): Promise<string[]> {
    const response = await this.client.models.list();
    return response.data
      .filter(m => m.id.startsWith('gpt-'))
      .map(m => m.id);
  }

  async isAvailable(): Promise<boolean> {
    return true; // Always available if API key valid
  }

  private formatMessages(request: ChatRequest): OpenAI.Chat.ChatCompletionMessageParam[] {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    // Add system message with context
    if (request.context) {
      messages.push({
        role: 'system',
        content: this.buildSystemPrompt(request.context)
      });
    }

    // Add conversation history
    for (const msg of request.messages) {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    }

    return messages;
  }

  private buildSystemPrompt(context: GeneticContext): string {
    return `You are a knowledgeable genetic health assistant. You help users understand their genetic analysis results.

IMPORTANT: You are NOT a doctor. Always recommend consulting healthcare professionals for medical decisions.

User's Genetic Summary:
${context.reportSummary}

Key Findings:
- ${context.pathogenicVariants.length} potentially significant variants
- ${context.drugInteractions.length} drug-gene interactions
- ${context.carrierStatus.length} carrier statuses

Provide helpful, accurate information about genetics. Be clear about limitations and uncertainties. If you don't know something, say so.`;
  }
}
```

### 4.3 Anthropic Implementation

```typescript
// packages/ai-providers/src/anthropic.ts

import Anthropic from '@anthropic-ai/sdk';

export class AnthropicProvider implements IAIProvider {
  name: AIProvider = 'anthropic';
  private client: Anthropic;

  constructor(apiKey: string, baseUrl?: string) {
    this.client = new Anthropic({
      apiKey,
      baseURL: baseUrl
    });
  }

  async complete(request: ChatRequest): Promise<ChatResponse> {
    const response = await this.client.messages.create({
      model: request.config.model,
      max_tokens: request.config.maxTokens ?? 2048,
      system: this.buildSystemPrompt(request.context),
      messages: request.messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }))
    });

    return {
      content: response.content[0]?.type === 'text'
        ? response.content[0].text
        : '',
      model: response.model,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens
      },
      finishReason: response.stop_reason as any
    };
  }

  async *stream(request: ChatRequest): AsyncIterable<StreamingChunk> {
    const stream = await this.client.messages.create({
      model: request.config.model,
      max_tokens: request.config.maxTokens ?? 2048,
      system: this.buildSystemPrompt(request.context),
      messages: request.messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      })),
      stream: true
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield { content: event.delta.text, done: false };
      }
      if (event.type === 'message_stop') {
        yield { content: '', done: true };
      }
    }
  }

  async listModels(): Promise<string[]> {
    return [
      'claude-3-5-sonnet-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ];
  }
}
```

### 4.4 Ollama Implementation (Local AI)

```typescript
// packages/ai-providers/src/ollama.ts

export class OllamaProvider implements IAIProvider {
  name: AIProvider = 'ollama';
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async isAvailable(): Promise<boolean> {
    return this.validateConnection();
  }

  async complete(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.config.model,
        messages: this.formatMessages(request),
        stream: false,
        options: {
          temperature: request.config.temperature ?? 0.7,
          num_predict: request.config.maxTokens ?? 2048
        }
      })
    });

    const data = await response.json();

    return {
      content: data.message?.content ?? '',
      model: data.model,
      usage: {
        promptTokens: data.prompt_eval_count ?? 0,
        completionTokens: data.eval_count ?? 0,
        totalTokens: (data.prompt_eval_count ?? 0) + (data.eval_count ?? 0)
      }
    };
  }

  async *stream(request: ChatRequest): AsyncIterable<StreamingChunk> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.config.model,
        messages: this.formatMessages(request),
        stream: true,
        options: {
          temperature: request.config.temperature ?? 0.7,
          num_predict: request.config.maxTokens ?? 2048
        }
      })
    });

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const lines = decoder.decode(value).split('\n').filter(Boolean);
      for (const line of lines) {
        const data = JSON.parse(line);
        yield {
          content: data.message?.content ?? '',
          done: data.done ?? false
        };
      }
    }
  }

  async listModels(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/api/tags`);
    const data = await response.json();
    return data.models?.map((m: any) => m.name) ?? [];
  }

  private formatMessages(request: ChatRequest): any[] {
    const messages: any[] = [];

    if (request.context) {
      messages.push({
        role: 'system',
        content: this.buildSystemPrompt(request.context)
      });
    }

    for (const msg of request.messages) {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    }

    return messages;
  }
}
```

---

## 5. Provider Factory

```typescript
// packages/ai-providers/src/factory.ts

export class AIProviderFactory {
  static create(config: AIConfig): IAIProvider {
    switch (config.provider) {
      case 'openai':
        if (!config.apiKey) throw new Error('OpenAI requires API key');
        return new OpenAIProvider(config.apiKey, config.baseUrl);

      case 'anthropic':
        if (!config.apiKey) throw new Error('Anthropic requires API key');
        return new AnthropicProvider(config.apiKey, config.baseUrl);

      case 'google':
        if (!config.apiKey) throw new Error('Google requires API key');
        return new GoogleProvider(config.apiKey, config.baseUrl);

      case 'ollama':
        return new OllamaProvider(config.baseUrl);

      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }
  }

  static async detectAvailableProviders(): Promise<AIProvider[]> {
    const available: AIProvider[] = [];

    // Ollama check (local)
    const ollama = new OllamaProvider();
    if (await ollama.isAvailable()) {
      available.push('ollama');
    }

    // Cloud providers always available if user has keys
    available.push('openai', 'anthropic', 'google');

    return available;
  }
}
```

---

## 6. Secure Key Management

### 6.1 Encryption Implementation

```typescript
// packages/encryption/src/web.ts

export interface EncryptedData {
  iv: string;        // Base64 IV
  ciphertext: string; // Base64 ciphertext
  salt: string;      // Base64 salt for key derivation
}

export class KeyManager {
  private static readonly ITERATIONS = 600000;
  private static readonly KEY_LENGTH = 256;

  /**
   * Derive encryption key from user password/PIN.
   */
  private static async deriveKey(
    password: string,
    salt: Uint8Array
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: this.ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt API key for storage.
   */
  static async encrypt(
    apiKey: string,
    password: string
  ): Promise<EncryptedData> {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const key = await this.deriveKey(password, salt);

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(apiKey)
    );

    return {
      iv: btoa(String.fromCharCode(...iv)),
      ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
      salt: btoa(String.fromCharCode(...salt))
    };
  }

  /**
   * Decrypt API key from storage.
   */
  static async decrypt(
    encrypted: EncryptedData,
    password: string
  ): Promise<string> {
    const iv = Uint8Array.from(atob(encrypted.iv), c => c.charCodeAt(0));
    const salt = Uint8Array.from(atob(encrypted.salt), c => c.charCodeAt(0));
    const ciphertext = Uint8Array.from(atob(encrypted.ciphertext), c => c.charCodeAt(0));

    const key = await this.deriveKey(password, salt);

    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(plaintext);
  }
}
```

### 6.2 Storage Interface

```typescript
// packages/encryption/src/storage.ts

export interface StoredKey {
  provider: AIProvider;
  encrypted: EncryptedData;
  createdAt: Date;
  lastUsed?: Date;
}

export class SecureKeyStorage {
  private db: GenomeForgeDB;

  constructor() {
    this.db = new GenomeForgeDB();
  }

  async saveKey(
    provider: AIProvider,
    apiKey: string,
    password: string
  ): Promise<void> {
    const encrypted = await KeyManager.encrypt(apiKey, password);

    await this.db.settings.put({
      key: `apiKey:${provider}`,
      value: {
        provider,
        encrypted,
        createdAt: new Date()
      } as StoredKey,
      encrypted: true
    });
  }

  async getKey(
    provider: AIProvider,
    password: string
  ): Promise<string | null> {
    const stored = await this.db.settings.get(`apiKey:${provider}`);
    if (!stored?.value) return null;

    const storedKey = stored.value as StoredKey;

    try {
      return await KeyManager.decrypt(storedKey.encrypted, password);
    } catch {
      return null; // Wrong password
    }
  }

  async hasKey(provider: AIProvider): Promise<boolean> {
    const stored = await this.db.settings.get(`apiKey:${provider}`);
    return !!stored?.value;
  }

  async deleteKey(provider: AIProvider): Promise<void> {
    await this.db.settings.delete(`apiKey:${provider}`);
  }
}
```

---

## 7. Prompt Engineering

### 7.1 Context Builder

```typescript
// packages/ai-providers/src/prompt-builder.ts

export class PromptBuilder {
  /**
   * Build genetic context from match results.
   * CRITICAL: Never include raw genome data.
   */
  static buildContext(matchResult: MatchResult): GeneticContext {
    return {
      pathogenicVariants: matchResult.annotatedSNPs
        .filter(s => s.category === 'pathogenic')
        .slice(0, 20) // Limit context size
        .map(s => ({
          gene: s.clinvar?.gene ?? 'Unknown',
          condition: s.clinvar?.conditions[0]?.name ?? 'Unknown',
          significance: s.clinvar?.clinicalSignificance ?? 'unknown',
          stars: s.clinvar?.reviewStatus ?? 0
        })),

      drugInteractions: matchResult.annotatedSNPs
        .filter(s => s.category === 'drug')
        .slice(0, 20)
        .flatMap(s => s.pharmgkb?.drugs.map(d => ({
          gene: s.pharmgkb!.gene,
          drug: d.drugName,
          phenotype: d.phenotypeCategory ?? 'Unknown',
          recommendation: d.annotation
        })) ?? []),

      carrierStatus: matchResult.annotatedSNPs
        .filter(s => s.category === 'carrier')
        .slice(0, 20)
        .map(s => ({
          gene: s.clinvar?.gene ?? 'Unknown',
          condition: s.clinvar?.conditions[0]?.name ?? 'Unknown'
        })),

      reportSummary: this.generateSummary(matchResult)
    };
  }

  private static generateSummary(result: MatchResult): string {
    const lines = [
      `Analysis of ${result.totalSNPs.toLocaleString()} genetic variants.`,
      `${result.matchedSNPs.toLocaleString()} variants matched against clinical databases.`,
      `${result.pathogenicCount} potentially pathogenic variants identified.`,
      `${result.drugInteractionCount} drug-gene interactions found.`,
      `${result.carrierCount} carrier statuses detected.`
    ];

    return lines.join(' ');
  }

  /**
   * Format user query with safety instructions.
   */
  static formatUserQuery(query: string): string {
    return `User question about their genetic analysis: ${query}

Remember to:
1. Be accurate but acknowledge uncertainties
2. Never diagnose or prescribe
3. Recommend consulting healthcare professionals
4. Explain in plain language`;
  }
}
```

### 7.2 Conversation Manager

```typescript
// packages/ai-providers/src/conversation.ts

export interface Conversation {
  id: string;
  messages: Message[];
  context: GeneticContext;
  createdAt: Date;
  lastMessageAt: Date;
}

export class ConversationManager {
  private db: GenomeForgeDB;

  async createConversation(context: GeneticContext): Promise<Conversation> {
    const conversation: Conversation = {
      id: crypto.randomUUID(),
      messages: [],
      context,
      createdAt: new Date(),
      lastMessageAt: new Date()
    };

    await this.db.conversations.put(conversation);
    return conversation;
  }

  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<void> {
    const conversation = await this.db.conversations.get(conversationId);
    if (!conversation) throw new Error('Conversation not found');

    conversation.messages.push({ role, content });
    conversation.lastMessageAt = new Date();

    // Limit conversation length to manage context
    if (conversation.messages.length > 50) {
      conversation.messages = conversation.messages.slice(-40);
    }

    await this.db.conversations.put(conversation);
  }

  async getConversation(id: string): Promise<Conversation | null> {
    return this.db.conversations.get(id) ?? null;
  }

  async listConversations(): Promise<Conversation[]> {
    return this.db.conversations
      .orderBy('lastMessageAt')
      .reverse()
      .limit(50)
      .toArray();
  }
}
```

---

## 8. Chat Service

### 8.1 Main Chat Interface

```typescript
// packages/ai-providers/src/chat-service.ts

export class ChatService {
  private provider: IAIProvider;
  private conversationManager: ConversationManager;

  constructor(config: AIConfig) {
    this.provider = AIProviderFactory.create(config);
    this.conversationManager = new ConversationManager();
  }

  async chat(
    conversationId: string,
    userMessage: string
  ): Promise<string> {
    const conversation = await this.conversationManager.getConversation(conversationId);
    if (!conversation) throw new Error('Conversation not found');

    // Add user message
    await this.conversationManager.addMessage(conversationId, 'user', userMessage);

    // Build request
    const request: ChatRequest = {
      messages: conversation.messages,
      config: { provider: this.provider.name, model: 'default' },
      context: conversation.context
    };

    // Get response
    const response = await this.provider.complete(request);

    // Save assistant message
    await this.conversationManager.addMessage(conversationId, 'assistant', response.content);

    return response.content;
  }

  async *chatStream(
    conversationId: string,
    userMessage: string
  ): AsyncIterable<string> {
    const conversation = await this.conversationManager.getConversation(conversationId);
    if (!conversation) throw new Error('Conversation not found');

    await this.conversationManager.addMessage(conversationId, 'user', userMessage);

    const request: ChatRequest = {
      messages: conversation.messages,
      config: { provider: this.provider.name, model: 'default' },
      context: conversation.context,
      stream: true
    };

    let fullResponse = '';

    for await (const chunk of this.provider.stream(request)) {
      fullResponse += chunk.content;
      yield chunk.content;
    }

    await this.conversationManager.addMessage(conversationId, 'assistant', fullResponse);
  }
}
```

---

## 9. React Hooks

```typescript
// apps/web/src/hooks/useChat.ts

export function useChat(config: AIConfig, context: GeneticContext) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  const chatService = useMemo(
    () => new ChatService(config),
    [config.provider, config.model]
  );

  // Initialize conversation
  useEffect(() => {
    chatService.conversationManager
      .createConversation(context)
      .then(setConversation);
  }, [context]);

  const sendMessage = useCallback(async (message: string) => {
    if (!conversation) return;

    setIsLoading(true);
    setStreamingContent('');

    try {
      for await (const chunk of chatService.chatStream(conversation.id, message)) {
        setStreamingContent(prev => prev + chunk);
      }
    } finally {
      setIsLoading(false);
      // Refresh conversation to get updated messages
      const updated = await chatService.conversationManager.getConversation(conversation.id);
      setConversation(updated);
    }
  }, [conversation, chatService]);

  return {
    conversation,
    isLoading,
    streamingContent,
    sendMessage
  };
}
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

```typescript
describe('AIProviders', () => {
  describe('PromptBuilder', () => {
    it('never includes raw genome data in context', () => {
      const matchResult = createMockMatchResult();
      const context = PromptBuilder.buildContext(matchResult);

      // Verify no rsIDs or genotypes in context
      const contextStr = JSON.stringify(context);
      expect(contextStr).not.toMatch(/rs\d+/);
      expect(contextStr).not.toMatch(/[ATCG]{2}/);
    });
  });

  describe('KeyManager', () => {
    it('encrypts and decrypts API keys correctly', async () => {
      const apiKey = 'sk-test-12345';
      const password = 'userpassword';

      const encrypted = await KeyManager.encrypt(apiKey, password);
      const decrypted = await KeyManager.decrypt(encrypted, password);

      expect(decrypted).toBe(apiKey);
    });

    it('fails with wrong password', async () => {
      const encrypted = await KeyManager.encrypt('sk-test', 'correct');

      await expect(
        KeyManager.decrypt(encrypted, 'wrong')
      ).rejects.toThrow();
    });
  });
});
```

### 10.2 Integration Tests

```typescript
describe('ChatService Integration', () => {
  it('completes a conversation with mock provider', async () => {
    const mockProvider = new MockAIProvider();
    const service = new ChatService({ provider: 'mock' } as any);

    const conversation = await service.createConversation(mockContext);
    const response = await service.chat(conversation.id, 'What does my BRCA1 status mean?');

    expect(response).toContain('genetic');
    expect(response).toContain('healthcare');
  });
});
```

---

## 11. Security Considerations

1. **API keys encrypted at rest** with AES-256-GCM
2. **Keys never transmitted** to GenomeForge servers
3. **Raw genome data never sent to AI** - only summaries
4. **HTTPS enforced** for all API calls
5. **Rate limiting** on client to prevent abuse
6. **Clear warnings** about AI limitations

---

## 12. Recommended Models

### 12.1 Cloud Providers

| Provider | Model | Best For | Cost |
|----------|-------|----------|------|
| OpenAI | gpt-4o | General Q&A | ~$0.01/query |
| OpenAI | gpt-4o-mini | Quick answers | ~$0.001/query |
| Anthropic | claude-3-5-sonnet | Complex reasoning | ~$0.015/query |
| Google | gemini-1.5-flash | Fast responses | ~$0.0005/query |

### 12.2 Local Models (Ollama)

| Model | Parameters | RAM Required | Best For |
|-------|-----------|--------------|----------|
| BioMistral-7B | 7B | 16GB | Medical Q&A (Apache 2.0) |
| Llama-3-8B | 8B | 16GB | General purpose |
| Gemma-2-9B | 9B | 16GB | Efficient inference |

---

**Document Version:** 1.0.0
**Author:** GenomeForge Team
**Last Updated:** 2026-01-28
