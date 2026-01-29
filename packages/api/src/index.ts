/**
 * @genomeforge/api
 *
 * GenomeForge API SDK for third-party integrations.
 *
 * This package provides:
 * - Remote API client for server integrations
 * - Local SDK for client-side processing
 * - Webhook utilities for event-driven workflows
 *
 * @example
 * ```typescript
 * // Remote API usage
 * import { createClient } from '@genomeforge/api';
 *
 * const client = createClient({ apiKey: 'your-api-key' });
 * const result = await client.startAnalysis({ genomeData: fileContent });
 *
 * // Local SDK usage (no server required)
 * import { createLocalSdk } from '@genomeforge/api';
 *
 * const sdk = createLocalSdk({ debug: true });
 * const result = await sdk.analyze({ genomeData: fileContent });
 * ```
 *
 * @packageDocumentation
 */

// Types
export * from './types';

// Client SDK (for remote API)
export {
  GenomeForgeClient,
  createClient,
  getClient,
  setClient,
} from './client';

// Local SDK (for client-side processing)
export {
  GenomeForgeLocal,
  createLocalSdk,
  getLocalSdk,
  setLocalSdk,
} from './local';
export type { LocalSdkOptions } from './local';

// Webhook utilities
export {
  WebhookManager,
  createWebhookManager,
  getWebhookManager,
  createWebhookPayload,
  createWebhookSignature,
  verifyWebhookSignature,
  createWebhookMiddleware,
  getWebhookEventDescription,
  WEBHOOK_EVENT_DESCRIPTIONS,
} from './webhooks';
export type { WebhookHandler } from './webhooks';

/**
 * Package version
 */
export const VERSION = '0.1.0';

/**
 * API version
 */
export const API_VERSION = '1.0.0';
