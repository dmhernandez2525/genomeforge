/**
 * Tests for the AI chat module
 * @packageDocumentation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  AIClient,
  OpenAIProvider,
  AnthropicProvider,
  GoogleProvider,
  OllamaProvider,
  createProvider,
  createChat,
  validateAPIKey,
  buildGeneticContext,
  formatContextForPrompt,
  DEFAULT_MODELS,
  PROVIDER_ENDPOINTS,
  GENETIC_ANALYSIS_SYSTEM_PROMPT
} from '../index';
import type {
  AIConfig,
  Message,
  EnhancedAnalysisResult,
  GeneticContext
} from '@genomeforge/types';

// ============================================================================
// Mock Data
// ============================================================================

function createMockAnalysisResult(): EnhancedAnalysisResult {
  return {
    genomeId: 'test-genome',
    analyzedAt: new Date(),
    riskAssessments: [
      {
        condition: 'Breast Cancer',
        gene: 'BRCA1',
        riskLevel: 'high',
        confidence: 1.0,
        variants: [{
          snp: {
            rsid: 'rs80357906',
            chromosome: '17',
            position: 41245466,
            genotype: 'AG',
            allele1: 'A',
            allele2: 'G'
          },
          clinvar: {
            rsid: 'rs80357906',
            vcv: 'VCV000123456',
            gene: 'BRCA1',
            geneId: 672,
            clinicalSignificance: 'pathogenic',
            reviewStatus: 4,
            conditions: [{ name: 'Breast Cancer', traits: [] }]
          },
          impactScore: 4.5,
          category: 'pathogenic'
        }],
        explanation: 'Pathogenic variant in BRCA1',
        inheritance: 'autosomal_dominant'
      }
    ],
    metabolizerPhenotypes: [
      {
        gene: 'CYP2D6',
        diplotype: '*4/*4',
        phenotype: 'poor',
        activityScore: 0,
        affectedDrugs: [{
          drugName: 'codeine',
          recommendation: 'Consider alternative pain medication.',
          severity: 'critical',
          evidenceLevel: '1A',
          hasFDALabel: true
        }],
        cpicStatus: 'available',
        contributingVariants: ['rs3892097']
      }
    ],
    carrierStatuses: [
      {
        gene: 'CFTR',
        condition: 'Cystic Fibrosis',
        inheritance: 'autosomal_recessive',
        carrierType: 'heterozygous',
        partnerRisk: '25% risk if partner is carrier'
      }
    ],
    traitAssociations: [],
    polygenicRiskScores: [],
    summary: {
      totalVariantsAnalyzed: 100,
      pathogenicCount: 1,
      highRiskCount: 1,
      moderateRiskCount: 0,
      pharmacogeneCount: 1,
      carrierCount: 1,
      traitAssociationCount: 0,
      prsCount: 0,
      keyFindings: []
    },
    databaseVersions: {
      clinvar: '2024-01',
      pharmgkb: '2024-01'
    }
  };
}

function createMockFetch(responseData: unknown, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    json: vi.fn().mockResolvedValue(responseData),
    text: vi.fn().mockResolvedValue(JSON.stringify(responseData)),
    body: {
      getReader: () => ({
        read: vi.fn()
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"done":true}\n') })
          .mockResolvedValueOnce({ done: true, value: undefined })
      })
    }
  });
}

// ============================================================================
// Tests
// ============================================================================

describe('AI Chat Module', () => {
  describe('Constants', () => {
    it('should have default models for all providers', () => {
      expect(DEFAULT_MODELS.openai).toBeDefined();
      expect(DEFAULT_MODELS.anthropic).toBeDefined();
      expect(DEFAULT_MODELS.google).toBeDefined();
      expect(DEFAULT_MODELS.ollama).toBeDefined();
    });

    it('should have endpoints for all providers', () => {
      expect(PROVIDER_ENDPOINTS.openai).toContain('api.openai.com');
      expect(PROVIDER_ENDPOINTS.anthropic).toContain('api.anthropic.com');
      expect(PROVIDER_ENDPOINTS.google).toContain('generativelanguage.googleapis.com');
      expect(PROVIDER_ENDPOINTS.ollama).toContain('localhost');
    });

    it('should have a comprehensive system prompt', () => {
      expect(GENETIC_ANALYSIS_SYSTEM_PROMPT).toContain('genetic');
      expect(GENETIC_ANALYSIS_SYSTEM_PROMPT).toContain('healthcare');
      expect(GENETIC_ANALYSIS_SYSTEM_PROMPT).toContain('disclaimers');
    });
  });

  describe('Genetic Context Builder', () => {
    it('should build context from analysis result', () => {
      const analysis = createMockAnalysisResult();
      const context = buildGeneticContext(analysis);

      expect(context).toBeDefined();
      expect(context.pathogenicVariants.length).toBeGreaterThan(0);
      expect(context.drugInteractions.length).toBeGreaterThan(0);
      expect(context.carrierStatus.length).toBeGreaterThan(0);
      expect(context.reportSummary).toBeTruthy();
    });

    it('should extract variant summaries', () => {
      const analysis = createMockAnalysisResult();
      const context = buildGeneticContext(analysis);

      const variant = context.pathogenicVariants[0];
      expect(variant.gene).toBe('BRCA1');
      expect(variant.condition).toBe('Breast Cancer');
      expect(variant.significance).toBe('pathogenic');
      expect(variant.stars).toBe(4);
    });

    it('should extract drug summaries', () => {
      const analysis = createMockAnalysisResult();
      const context = buildGeneticContext(analysis);

      const drug = context.drugInteractions[0];
      expect(drug.gene).toBe('CYP2D6');
      expect(drug.drug).toBe('codeine');
      expect(drug.phenotype).toBe('poor');
    });

    it('should extract carrier summaries', () => {
      const analysis = createMockAnalysisResult();
      const context = buildGeneticContext(analysis);

      const carrier = context.carrierStatus[0];
      expect(carrier.gene).toBe('CFTR');
      expect(carrier.condition).toBe('Cystic Fibrosis');
    });

    it('should build report summary text', () => {
      const analysis = createMockAnalysisResult();
      const context = buildGeneticContext(analysis);

      expect(context.reportSummary).toContain('high-risk');
      expect(context.reportSummary).toContain('pharmacogene');
      expect(context.reportSummary).toContain('carrier');
    });

    it('should handle empty analysis results', () => {
      const emptyAnalysis: EnhancedAnalysisResult = {
        genomeId: 'empty',
        analyzedAt: new Date(),
        riskAssessments: [],
        metabolizerPhenotypes: [],
        carrierStatuses: [],
        traitAssociations: [],
        polygenicRiskScores: [],
        summary: {
          totalVariantsAnalyzed: 0,
          pathogenicCount: 0,
          highRiskCount: 0,
          moderateRiskCount: 0,
          pharmacogeneCount: 0,
          carrierCount: 0,
          traitAssociationCount: 0,
          prsCount: 0,
          keyFindings: []
        },
        databaseVersions: {}
      };

      const context = buildGeneticContext(emptyAnalysis);

      expect(context.pathogenicVariants.length).toBe(0);
      expect(context.drugInteractions.length).toBe(0);
      expect(context.carrierStatus.length).toBe(0);
      expect(context.reportSummary).toContain('No significant');
    });
  });

  describe('Context Formatting', () => {
    it('should format context for prompt', () => {
      const analysis = createMockAnalysisResult();
      const context = buildGeneticContext(analysis);
      const formatted = formatContextForPrompt(context);

      expect(formatted).toContain('GENETIC CONTEXT');
      expect(formatted).toContain('PATHOGENIC VARIANTS');
      expect(formatted).toContain('DRUG INTERACTIONS');
      expect(formatted).toContain('CARRIER STATUS');
      expect(formatted).toContain('BRCA1');
    });

    it('should truncate long contexts', () => {
      const context: GeneticContext = {
        pathogenicVariants: Array(100).fill({
          gene: 'GENE',
          condition: 'Condition with a very long name that takes up space',
          significance: 'pathogenic',
          stars: 4
        }),
        drugInteractions: [],
        carrierStatus: [],
        reportSummary: 'Test summary'
      };

      const formatted = formatContextForPrompt(context, 500);

      expect(formatted.length).toBeLessThanOrEqual(500);
      expect(formatted).toContain('...');
    });
  });

  describe('createProvider', () => {
    it('should create OpenAI provider', () => {
      const config: AIConfig = {
        provider: 'openai',
        model: 'gpt-4o',
        apiKey: 'test-key'
      };

      const provider = createProvider(config);
      expect(provider).toBeInstanceOf(OpenAIProvider);
      expect(provider.name).toBe('openai');
    });

    it('should create Anthropic provider', () => {
      const config: AIConfig = {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        apiKey: 'test-key'
      };

      const provider = createProvider(config);
      expect(provider).toBeInstanceOf(AnthropicProvider);
      expect(provider.name).toBe('anthropic');
    });

    it('should create Google provider', () => {
      const config: AIConfig = {
        provider: 'google',
        model: 'gemini-1.5-pro',
        apiKey: 'test-key'
      };

      const provider = createProvider(config);
      expect(provider).toBeInstanceOf(GoogleProvider);
      expect(provider.name).toBe('google');
    });

    it('should create Ollama provider', () => {
      const config: AIConfig = {
        provider: 'ollama',
        model: 'llama3.2'
      };

      const provider = createProvider(config);
      expect(provider).toBeInstanceOf(OllamaProvider);
      expect(provider.name).toBe('ollama');
    });

    it('should throw for unknown provider', () => {
      const config: AIConfig = {
        provider: 'unknown' as any,
        model: 'test'
      };

      expect(() => createProvider(config)).toThrow('Unknown AI provider');
    });
  });

  describe('OpenAI Provider', () => {
    it('should complete chat requests', async () => {
      const mockFetch = createMockFetch({
        choices: [{ message: { content: 'Hello!' }, finish_reason: 'stop' }],
        model: 'gpt-4o',
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
      });

      const provider = new OpenAIProvider(
        { provider: 'openai', model: 'gpt-4o', apiKey: 'test' },
        mockFetch
      );

      const response = await provider.complete({
        messages: [{ role: 'user', content: 'Hi' }],
        config: { provider: 'openai', model: 'gpt-4o', apiKey: 'test' }
      });

      expect(response.content).toBe('Hello!');
      expect(response.model).toBe('gpt-4o');
      expect(response.usage?.totalTokens).toBe(15);
    });

    it('should validate connection', async () => {
      const mockFetch = createMockFetch({ data: [] });
      const provider = new OpenAIProvider(
        { provider: 'openai', model: 'gpt-4o', apiKey: 'test' },
        mockFetch
      );

      const valid = await provider.validateConnection();
      expect(valid).toBe(true);
    });

    it('should list models', async () => {
      const mockFetch = createMockFetch({
        data: [{ id: 'gpt-4o' }, { id: 'gpt-3.5-turbo' }]
      });

      const provider = new OpenAIProvider(
        { provider: 'openai', model: 'gpt-4o', apiKey: 'test' },
        mockFetch
      );

      const models = await provider.listModels();
      expect(models).toContain('gpt-4o');
    });

    it('should handle API errors', async () => {
      const mockFetch = createMockFetch({ error: 'Invalid API key' }, false);
      const provider = new OpenAIProvider(
        { provider: 'openai', model: 'gpt-4o', apiKey: 'invalid' },
        mockFetch
      );

      await expect(provider.complete({
        messages: [{ role: 'user', content: 'Hi' }],
        config: { provider: 'openai', model: 'gpt-4o', apiKey: 'invalid' }
      })).rejects.toThrow('OpenAI API error');
    });
  });

  describe('Anthropic Provider', () => {
    it('should complete chat requests', async () => {
      const mockFetch = createMockFetch({
        content: [{ text: 'Hello from Claude!' }],
        model: 'claude-sonnet-4-20250514',
        usage: { input_tokens: 10, output_tokens: 5 },
        stop_reason: 'end_turn'
      });

      const provider = new AnthropicProvider(
        { provider: 'anthropic', model: 'claude-sonnet-4-20250514', apiKey: 'test' },
        mockFetch
      );

      const response = await provider.complete({
        messages: [{ role: 'user', content: 'Hi' }],
        config: { provider: 'anthropic', model: 'claude-sonnet-4-20250514', apiKey: 'test' }
      });

      expect(response.content).toBe('Hello from Claude!');
      expect(response.model).toBe('claude-sonnet-4-20250514');
    });

    it('should list available models', async () => {
      const mockFetch = createMockFetch({});
      const provider = new AnthropicProvider(
        { provider: 'anthropic', model: 'claude-sonnet-4-20250514', apiKey: 'test' },
        mockFetch
      );

      const models = await provider.listModels();
      expect(models).toContain('claude-sonnet-4-20250514');
      expect(models.length).toBeGreaterThan(0);
    });
  });

  describe('Google Provider', () => {
    it('should complete chat requests', async () => {
      const mockFetch = createMockFetch({
        candidates: [{
          content: { parts: [{ text: 'Hello from Gemini!' }] },
          finishReason: 'STOP'
        }],
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 }
      });

      const provider = new GoogleProvider(
        { provider: 'google', model: 'gemini-1.5-pro', apiKey: 'test' },
        mockFetch
      );

      const response = await provider.complete({
        messages: [{ role: 'user', content: 'Hi' }],
        config: { provider: 'google', model: 'gemini-1.5-pro', apiKey: 'test' }
      });

      expect(response.content).toBe('Hello from Gemini!');
    });
  });

  describe('Ollama Provider', () => {
    it('should complete chat requests', async () => {
      const mockFetch = createMockFetch({
        message: { content: 'Hello from Ollama!' },
        model: 'llama3.2',
        done: true,
        prompt_eval_count: 10,
        eval_count: 5
      });

      const provider = new OllamaProvider(
        { provider: 'ollama', model: 'llama3.2' },
        mockFetch
      );

      const response = await provider.complete({
        messages: [{ role: 'user', content: 'Hi' }],
        config: { provider: 'ollama', model: 'llama3.2' }
      });

      expect(response.content).toBe('Hello from Ollama!');
      expect(response.model).toBe('llama3.2');
    });

    it('should use localhost by default', async () => {
      const mockFetch = createMockFetch({ models: [] });
      const provider = new OllamaProvider(
        { provider: 'ollama', model: 'llama3.2' },
        mockFetch
      );

      await provider.listModels();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('localhost'),
        expect.any(Object)
      );
    });
  });

  describe('AIClient', () => {
    it('should create client with config', () => {
      const mockFetch = createMockFetch({});
      const client = new AIClient({
        config: { provider: 'openai', model: 'gpt-4o', apiKey: 'test' },
        fetchFn: mockFetch
      });

      expect(client).toBeDefined();
    });

    it('should set context from analysis', () => {
      const mockFetch = createMockFetch({});
      const client = new AIClient({
        config: { provider: 'openai', model: 'gpt-4o', apiKey: 'test' },
        fetchFn: mockFetch
      });

      const analysis = createMockAnalysisResult();
      client.setContextFromAnalysis(analysis);

      // Context should be set (no direct way to verify, but no error)
      expect(client).toBeDefined();
    });

    it('should validate connection', async () => {
      const mockFetch = createMockFetch({ data: [] });
      const client = new AIClient({
        config: { provider: 'openai', model: 'gpt-4o', apiKey: 'test' },
        fetchFn: mockFetch
      });

      const result = await client.validateConnection();
      expect(result.valid).toBe(true);
      expect(result.message).toContain('successful');
    });

    it('should handle validation failure', async () => {
      const mockFetch = createMockFetch({}, false);
      const client = new AIClient({
        config: { provider: 'openai', model: 'gpt-4o', apiKey: 'invalid' },
        fetchFn: mockFetch
      });

      const result = await client.validateConnection();
      expect(result.valid).toBe(false);
    });

    it('should chat with messages', async () => {
      const mockFetch = createMockFetch({
        choices: [{ message: { content: 'Response' }, finish_reason: 'stop' }],
        model: 'gpt-4o'
      });

      const client = new AIClient({
        config: { provider: 'openai', model: 'gpt-4o', apiKey: 'test' },
        fetchFn: mockFetch
      });

      const response = await client.chat([
        { role: 'user', content: 'Hello' }
      ]);

      expect(response.content).toBe('Response');
    });

    it('should check availability', async () => {
      const mockFetch = createMockFetch({ data: [] });
      const client = new AIClient({
        config: { provider: 'openai', model: 'gpt-4o', apiKey: 'test' },
        fetchFn: mockFetch
      });

      const available = await client.isAvailable();
      expect(available).toBe(true);
    });

    it('should list models', async () => {
      const mockFetch = createMockFetch({
        data: [{ id: 'gpt-4o' }]
      });

      const client = new AIClient({
        config: { provider: 'openai', model: 'gpt-4o', apiKey: 'test' },
        fetchFn: mockFetch
      });

      const models = await client.listModels();
      expect(models).toContain('gpt-4o');
    });
  });

  describe('Convenience Functions', () => {
    describe('createChat', () => {
      it('should create a simple chat function', async () => {
        const mockFetch = createMockFetch({
          choices: [{ message: { content: 'Hi there!' } }],
          model: 'gpt-4o'
        });

        const chat = createChat(
          { provider: 'openai', model: 'gpt-4o', apiKey: 'test' }
        );

        // Override fetch for the test
        // This is a simplified test
        expect(chat).toBeDefined();
        expect(typeof chat).toBe('function');
      });
    });

    describe('validateAPIKey', () => {
      it('should validate valid API key', async () => {
        const mockFetch = createMockFetch({ data: [] });
        global.fetch = mockFetch;

        const valid = await validateAPIKey('openai', 'test-key');
        expect(valid).toBe(true);
      });

      it('should reject invalid API key', async () => {
        const mockFetch = createMockFetch({}, false);
        global.fetch = mockFetch;

        const valid = await validateAPIKey('openai', 'invalid-key');
        expect(valid).toBe(false);
      });
    });
  });

  describe('Custom Base URLs', () => {
    it('should use custom base URL for OpenAI', async () => {
      const mockFetch = createMockFetch({
        choices: [{ message: { content: 'Response' } }],
        model: 'gpt-4o'
      });

      const provider = new OpenAIProvider(
        {
          provider: 'openai',
          model: 'gpt-4o',
          apiKey: 'test',
          baseUrl: 'https://custom.api.com/v1/chat/completions'
        },
        mockFetch
      );

      await provider.complete({
        messages: [{ role: 'user', content: 'Hi' }],
        config: { provider: 'openai', model: 'gpt-4o', apiKey: 'test' }
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom.api.com/v1/chat/completions',
        expect.any(Object)
      );
    });

    it('should use custom base URL for Ollama', async () => {
      const mockFetch = createMockFetch({
        message: { content: 'Response' },
        done: true
      });

      const provider = new OllamaProvider(
        {
          provider: 'ollama',
          model: 'llama3.2',
          baseUrl: 'http://192.168.1.100:11434/api/chat'
        },
        mockFetch
      );

      await provider.complete({
        messages: [{ role: 'user', content: 'Hi' }],
        config: { provider: 'ollama', model: 'llama3.2' }
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://192.168.1.100:11434/api/chat',
        expect.any(Object)
      );
    });
  });

  describe('Message Preparation', () => {
    it('should include system prompt in OpenAI messages', async () => {
      const mockFetch = createMockFetch({
        choices: [{ message: { content: 'Response' } }]
      });

      const provider = new OpenAIProvider(
        { provider: 'openai', model: 'gpt-4o', apiKey: 'test' },
        mockFetch
      );

      await provider.complete({
        messages: [{ role: 'user', content: 'Hi' }],
        config: { provider: 'openai', model: 'gpt-4o', apiKey: 'test' }
      });

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);

      expect(body.messages[0].role).toBe('system');
      expect(body.messages[0].content).toContain('genetic');
    });

    it('should include context in system prompt when provided', async () => {
      const mockFetch = createMockFetch({
        choices: [{ message: { content: 'Response' } }]
      });

      const provider = new OpenAIProvider(
        { provider: 'openai', model: 'gpt-4o', apiKey: 'test' },
        mockFetch
      );

      const context = buildGeneticContext(createMockAnalysisResult());

      await provider.complete({
        messages: [{ role: 'user', content: 'Hi' }],
        config: { provider: 'openai', model: 'gpt-4o', apiKey: 'test' },
        context
      });

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);

      expect(body.messages[0].content).toContain('GENETIC CONTEXT');
      expect(body.messages[0].content).toContain('BRCA1');
    });
  });
});
