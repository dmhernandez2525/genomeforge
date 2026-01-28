import type { Message, GeneticContext } from '@genomeforge/types';
import type { IAIProvider, StreamCallbacks } from './types';
import { buildSystemPrompt } from './types';

/**
 * Ollama provider implementation for 100% offline AI
 *
 * Supports local models running via Ollama.
 * No API key required - completely offline operation.
 *
 * Recommended models for genetic analysis:
 * - biomistral: BioMistral-7B (Apache 2.0 license - most permissive)
 * - mistral: General purpose, good balance
 * - mixtral: Higher quality, needs more resources
 *
 * Installation:
 * 1. Install Ollama: https://ollama.ai
 * 2. Pull model: `ollama pull biomistral`
 * 3. Ollama runs on http://localhost:11434 by default
 */
export class OllamaProvider implements IAIProvider {
  readonly provider = 'ollama' as const;
  private baseUrl: string;
  private model: string;

  constructor(baseUrl?: string, model?: string) {
    this.baseUrl = baseUrl || 'http://localhost:11434';
    this.model = model || 'biomistral';
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async chat(messages: Message[], context?: GeneticContext): Promise<string> {
    const systemPrompt = buildSystemPrompt(context);

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content }))
        ],
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const data = await response.json();
    return data.message?.content || '';
  }

  async chatStream(
    messages: Message[],
    context: GeneticContext | undefined,
    callbacks: StreamCallbacks
  ): Promise<void> {
    const systemPrompt = buildSystemPrompt(context);

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map((m) => ({ role: m.role, content: m.content }))
          ],
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            const token = parsed.message?.content || '';
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
    const response = await fetch(`${this.baseUrl}/api/tags`);

    if (!response.ok) {
      throw new Error('Failed to fetch Ollama models');
    }

    const data = await response.json();
    return data.models?.map((m: { name: string }) => m.name) || [];
  }

  setModel(model: string): void {
    this.model = model;
  }

  /**
   * Pull a model from the Ollama library
   */
  async pullModel(
    modelName: string,
    onProgress?: (status: string, completed?: number, total?: number) => void
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/pull`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: modelName, stream: true })
    });

    if (!response.ok) {
      throw new Error(`Failed to pull model: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(Boolean);

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          onProgress?.(parsed.status, parsed.completed, parsed.total);
        } catch {
          // Skip malformed JSON
        }
      }
    }
  }

  /**
   * Check if a specific model is installed
   */
  async hasModel(modelName: string): Promise<boolean> {
    const models = await this.getModels();
    return models.some((m) => m.startsWith(modelName));
  }

  /**
   * Get recommended models for genetic analysis
   * BioMistral-7B is Apache 2.0 licensed - most permissive for commercial use
   */
  static getRecommendedModels(): { name: string; description: string; size: string }[] {
    return [
      {
        name: 'biomistral',
        description: 'BioMistral-7B - Medical/biological AI (Apache 2.0)',
        size: '4.1 GB'
      },
      {
        name: 'mistral',
        description: 'Mistral 7B - General purpose (Apache 2.0)',
        size: '4.1 GB'
      },
      {
        name: 'llama2',
        description: 'Llama 2 7B - Meta AI (Custom license)',
        size: '3.8 GB'
      },
      {
        name: 'mixtral',
        description: 'Mixtral 8x7B - High quality, needs more RAM',
        size: '26 GB'
      }
    ];
  }
}
