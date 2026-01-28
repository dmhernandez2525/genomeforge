import type { AIProvider } from '@genomeforge/types';
import type { IAIProvider, AIProviderConfig } from './types';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { GoogleProvider } from './google';
import { OllamaProvider } from './ollama';

/**
 * Factory for creating AI provider instances
 *
 * Usage:
 * ```typescript
 * const provider = AIProviderFactory.create({
 *   provider: 'openai',
 *   apiKey: 'sk-...',
 *   model: 'gpt-4'
 * });
 *
 * const response = await provider.chat([
 *   { role: 'user', content: 'What does this variant mean?' }
 * ], geneticContext);
 * ```
 */
export class AIProviderFactory {
  /**
   * Create an AI provider instance based on configuration
   */
  static create(config: AIProviderConfig): IAIProvider {
    switch (config.provider) {
      case 'openai':
        if (!config.apiKey) {
          throw new Error('OpenAI requires an API key');
        }
        return new OpenAIProvider(config.apiKey, config.baseUrl, config.model);

      case 'anthropic':
        if (!config.apiKey) {
          throw new Error('Anthropic requires an API key');
        }
        return new AnthropicProvider(config.apiKey, config.baseUrl, config.model);

      case 'google':
        if (!config.apiKey) {
          throw new Error('Google AI requires an API key');
        }
        return new GoogleProvider(config.apiKey, config.baseUrl, config.model);

      case 'ollama':
        return new OllamaProvider(config.baseUrl, config.model);

      default:
        throw new Error(`Unknown AI provider: ${config.provider}`);
    }
  }

  /**
   * Get the default model for a provider
   */
  static getDefaultModel(provider: AIProvider): string {
    switch (provider) {
      case 'openai':
        return 'gpt-4-turbo-preview';
      case 'anthropic':
        return 'claude-3-sonnet-20240229';
      case 'google':
        return 'gemini-pro';
      case 'ollama':
        return 'biomistral'; // BioMistral-7B recommended for medical AI
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Get recommended models for genetic analysis
   */
  static getRecommendedModels(provider: AIProvider): string[] {
    switch (provider) {
      case 'openai':
        return ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo'];
      case 'anthropic':
        return ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'];
      case 'google':
        return ['gemini-pro', 'gemini-ultra'];
      case 'ollama':
        // BioMistral-7B is Apache 2.0 licensed - most permissive for commercial use
        return ['biomistral', 'mistral', 'llama2', 'mixtral'];
      default:
        return [];
    }
  }

  /**
   * Check if a provider requires an API key
   */
  static requiresApiKey(provider: AIProvider): boolean {
    return provider !== 'ollama';
  }

  /**
   * Get the base URL for a provider (if different from default)
   */
  static getDefaultBaseUrl(provider: AIProvider): string {
    switch (provider) {
      case 'openai':
        return 'https://api.openai.com/v1';
      case 'anthropic':
        return 'https://api.anthropic.com/v1';
      case 'google':
        return 'https://generativelanguage.googleapis.com/v1';
      case 'ollama':
        return 'http://localhost:11434';
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }
}
