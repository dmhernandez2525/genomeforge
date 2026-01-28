import type { Message, GeneticContext } from '@genomeforge/types';
import type { IAIProvider, StreamCallbacks } from './types';
import { buildSystemPrompt } from './types';

/**
 * Google AI (Gemini) provider implementation
 *
 * Supports Gemini Pro and Ultra models.
 * Requires user's own API key (BYOK model).
 */
export class GoogleProvider implements IAIProvider {
  readonly provider = 'google' as const;
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(apiKey: string, baseUrl?: string, model?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || 'https://generativelanguage.googleapis.com/v1';
    this.model = model || 'gemini-pro';
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/models/${this.model}?key=${this.apiKey}`
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async chat(messages: Message[], context?: GeneticContext): Promise<string> {
    const systemPrompt = buildSystemPrompt(context);

    // Convert messages to Gemini format
    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'I understand. I will help with genetic analysis questions while maintaining privacy and recommending professional consultation.' }] },
      ...messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))
    ];

    const response = await fetch(
      `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contents })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Google AI API error');
    }

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || '';
  }

  async chatStream(
    messages: Message[],
    context: GeneticContext | undefined,
    callbacks: StreamCallbacks
  ): Promise<void> {
    const systemPrompt = buildSystemPrompt(context);

    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'I understand. I will help with genetic analysis questions.' }] },
      ...messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))
    ];

    try {
      const response = await fetch(
        `${this.baseUrl}/models/${this.model}:streamGenerateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ contents })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Google AI API error');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        // Google streams JSON objects separated by newlines
        const lines = chunk.split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            const token = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (token) {
              fullResponse += token;
              callbacks.onToken?.(token);
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
    const response = await fetch(`${this.baseUrl}/models?key=${this.apiKey}`);

    if (!response.ok) {
      throw new Error('Failed to fetch models');
    }

    const data = await response.json();
    return data.models
      .filter((m: { name: string }) => m.name.includes('gemini'))
      .map((m: { name: string }) => m.name.replace('models/', ''));
  }

  setModel(model: string): void {
    this.model = model;
  }
}
