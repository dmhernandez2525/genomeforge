/**
 * Mobile AI Chat Service
 *
 * Provides AI chat functionality with support for multiple providers.
 * Implements BYOK (Bring Your Own Key) pattern for privacy.
 */

import * as SecureStore from 'expo-secure-store';

export type AIProvider = 'openai' | 'anthropic' | 'ollama';

export interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Default models for each provider
const DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: 'gpt-4-turbo-preview',
  anthropic: 'claude-3-sonnet-20240229',
  ollama: 'llama2',
};

// API endpoints
const API_ENDPOINTS: Record<AIProvider, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages',
  ollama: 'http://localhost:11434/api/chat',
};

// Secure store keys
const API_KEY_PREFIX = 'genomeforge_api_key_';

/**
 * Store API key securely
 */
export async function storeApiKey(provider: AIProvider, apiKey: string): Promise<void> {
  await SecureStore.setItemAsync(`${API_KEY_PREFIX}${provider}`, apiKey);
}

/**
 * Retrieve API key from secure storage
 */
export async function getApiKey(provider: AIProvider): Promise<string | null> {
  return SecureStore.getItemAsync(`${API_KEY_PREFIX}${provider}`);
}

/**
 * Remove API key from secure storage
 */
export async function removeApiKey(provider: AIProvider): Promise<void> {
  await SecureStore.deleteItemAsync(`${API_KEY_PREFIX}${provider}`);
}

/**
 * Check if API key is stored for a provider
 */
export async function hasApiKey(provider: AIProvider): Promise<boolean> {
  const key = await getApiKey(provider);
  return key !== null && key.length > 0;
}

/**
 * Get system prompt for genetic analysis assistant
 */
function getSystemPrompt(genomeContext?: string): string {
  let prompt = `You are GenomeForge AI, a helpful genetic analysis assistant. You help users understand their genetic data, explain variants, and answer questions about genetic health.

Important guidelines:
1. Always clarify that genetic information is educational and not medical advice
2. Recommend consulting healthcare professionals for medical decisions
3. Explain complex genetic concepts in accessible language
4. Be empathetic when discussing health-related genetic information
5. Never share or request actual genetic data outside the conversation
6. Focus on education and understanding rather than diagnosis`;

  if (genomeContext) {
    prompt += `\n\nThe user has uploaded their genetic data. Here is a summary of relevant findings:\n${genomeContext}`;
  }

  return prompt;
}

/**
 * Send chat message to OpenAI
 */
async function sendToOpenAI(
  messages: Message[],
  config: AIConfig,
  genomeContext?: string
): Promise<ChatResponse> {
  const apiKey = config.apiKey || (await getApiKey('openai'));
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const systemMessage = {
    role: 'system',
    content: getSystemPrompt(genomeContext),
  };

  const formattedMessages = [
    systemMessage,
    ...messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ];

  const response = await fetch(API_ENDPOINTS.openai, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || DEFAULT_MODELS.openai,
      messages: formattedMessages,
      max_tokens: 2048,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    usage: {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    },
  };
}

/**
 * Send chat message to Anthropic
 */
async function sendToAnthropic(
  messages: Message[],
  config: AIConfig,
  genomeContext?: string
): Promise<ChatResponse> {
  const apiKey = config.apiKey || (await getApiKey('anthropic'));
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const formattedMessages = messages.map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content,
  }));

  const response = await fetch(API_ENDPOINTS.anthropic, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model || DEFAULT_MODELS.anthropic,
      max_tokens: 2048,
      system: getSystemPrompt(genomeContext),
      messages: formattedMessages,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.content[0].text,
    usage: {
      promptTokens: data.usage?.input_tokens || 0,
      completionTokens: data.usage?.output_tokens || 0,
      totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
    },
  };
}

/**
 * Send chat message to Ollama (local)
 */
async function sendToOllama(
  messages: Message[],
  config: AIConfig,
  genomeContext?: string
): Promise<ChatResponse> {
  const baseUrl = config.baseUrl || 'http://localhost:11434';

  const systemMessage = {
    role: 'system' as const,
    content: getSystemPrompt(genomeContext),
  };

  const formattedMessages = [
    systemMessage,
    ...messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ];

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model || DEFAULT_MODELS.ollama,
      messages: formattedMessages,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.message.content,
  };
}

/**
 * Send chat message to configured AI provider
 */
export async function sendMessage(
  messages: Message[],
  config: AIConfig,
  genomeContext?: string
): Promise<ChatResponse> {
  switch (config.provider) {
    case 'openai':
      return sendToOpenAI(messages, config, genomeContext);
    case 'anthropic':
      return sendToAnthropic(messages, config, genomeContext);
    case 'ollama':
      return sendToOllama(messages, config, genomeContext);
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}

/**
 * Generate a unique message ID
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a user message
 */
export function createUserMessage(content: string): Message {
  return {
    id: generateMessageId(),
    role: 'user',
    content,
    timestamp: new Date(),
  };
}

/**
 * Create an assistant message
 */
export function createAssistantMessage(content: string): Message {
  return {
    id: generateMessageId(),
    role: 'assistant',
    content,
    timestamp: new Date(),
  };
}

/**
 * Get available models for a provider
 */
export function getAvailableModels(provider: AIProvider): string[] {
  switch (provider) {
    case 'openai':
      return ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo'];
    case 'anthropic':
      return ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'];
    case 'ollama':
      return ['llama2', 'mistral', 'codellama', 'phi'];
    default:
      return [];
  }
}

/**
 * Get default model for a provider
 */
export function getDefaultModel(provider: AIProvider): string {
  return DEFAULT_MODELS[provider];
}
