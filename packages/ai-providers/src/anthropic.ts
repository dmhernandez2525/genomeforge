import type { Message, GeneticContext } from '@genomeforge/types';
import type { IAIProvider, StreamCallbacks } from './types';
import { buildSystemPrompt } from './types';

/**
 * Anthropic Claude provider implementation
 *
 * Supports Claude 3 models via the Anthropic API.
 * Requires user's own API key (BYOK model).
 */
export class AnthropicProvider implements IAIProvider {
  readonly provider = 'anthropic' as const;
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(apiKey: string, baseUrl?: string, model?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || 'https://api.anthropic.com/v1';
    this.model = model || 'claude-3-sonnet-20240229';
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Anthropic doesn't have a simple health check endpoint
      // We'll do a minimal completion request
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }]
        })
      });
      return response.ok || response.status === 400; // 400 means API is reachable but request was bad
    } catch {
      return false;
    }
  }

  async chat(messages: Message[], context?: GeneticContext): Promise<string> {
    const systemPrompt = buildSystemPrompt(context);

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: messages.map((m) => ({ role: m.role, content: m.content }))
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Anthropic API error');
    }

    const data = await response.json();
    return data.content[0]?.text || '';
  }

  async chatStream(
    messages: Message[],
    context: GeneticContext | undefined,
    callbacks: StreamCallbacks
  ): Promise<void> {
    const systemPrompt = buildSystemPrompt(context);

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 4096,
          system: systemPrompt,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          stream: true
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Anthropic API error');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((line) => line.startsWith('data: '));

        for (const line of lines) {
          const data = line.slice(6);
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta') {
              const token = parsed.delta?.text || '';
              if (token) {
                fullResponse += token;
                callbacks.onToken?.(token);
              }
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }

      callbacks.onComplete?.(fullResponse);
    } catch (error) {
      callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async getModels(): Promise<string[]> {
    // Anthropic doesn't have a models endpoint, return known models
    return [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ];
  }

  setModel(model: string): void {
    this.model = model;
  }
}
