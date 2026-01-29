/**
 * Webhook Utilities
 *
 * Helpers for webhook integration and verification.
 */

import type { WebhookConfig, WebhookPayload, WebhookEvent } from './types';

/**
 * Create a webhook signature using HMAC-SHA256
 * Works in both browser (SubtleCrypto) and Node.js (crypto) environments
 */
export async function createWebhookSignatureAsync(
  payload: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);

  // Use Web Crypto API (available in browsers and Node.js 15+)
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    const hashArray = Array.from(new Uint8Array(signature));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    return `sha256=${hashHex}`;
  }

  // Fallback for older Node.js environments
  try {
    // Dynamic import to avoid bundler issues
    const cryptoModule = await import('crypto');
    const hmac = cryptoModule.createHmac('sha256', secret);
    hmac.update(payload);
    return `sha256=${hmac.digest('hex')}`;
  } catch {
    throw new Error('HMAC-SHA256 is not available in this environment');
  }
}

/**
 * Synchronous signature creation (for backwards compatibility)
 * Uses Node.js crypto module - throws in browser environments
 */
export function createWebhookSignature(
  payload: string,
  secret: string
): string {
  // This synchronous version only works in Node.js
  // For browser compatibility, use createWebhookSignatureAsync
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    return `sha256=${hmac.digest('hex')}`;
  } catch {
    // For synchronous fallback in environments without Node.js crypto,
    // we throw an error directing users to the async version
    throw new Error(
      'Synchronous webhook signature creation requires Node.js crypto module. ' +
      'Use createWebhookSignatureAsync() for browser compatibility.'
    );
  }
}

/**
 * Verify a webhook signature (synchronous - Node.js only)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = createWebhookSignature(payload, secret);
  return timingSafeEqual(signature, expectedSignature);
}

/**
 * Verify a webhook signature (async - works in browser and Node.js)
 */
export async function verifyWebhookSignatureAsync(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expectedSignature = await createWebhookSignatureAsync(payload, secret);
  return timingSafeEqual(signature, expectedSignature);
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Create a webhook payload (synchronous - Node.js only)
 */
export function createWebhookPayload(
  event: WebhookEvent,
  data: Record<string, unknown>,
  secret?: string
): WebhookPayload {
  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  if (secret) {
    payload.signature = createWebhookSignature(JSON.stringify(payload), secret);
  }

  return payload;
}

/**
 * Create a webhook payload (async - works in browser and Node.js)
 */
export async function createWebhookPayloadAsync(
  event: WebhookEvent,
  data: Record<string, unknown>,
  secret?: string
): Promise<WebhookPayload> {
  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  if (secret) {
    payload.signature = await createWebhookSignatureAsync(JSON.stringify(payload), secret);
  }

  return payload;
}

/**
 * Webhook handler type
 */
export type WebhookHandler = (payload: WebhookPayload) => Promise<void> | void;

/**
 * Webhook manager for handling incoming webhooks
 */
export class WebhookManager {
  private handlers: Map<WebhookEvent, Set<WebhookHandler>> = new Map();
  private configs: Map<string, WebhookConfig> = new Map();

  /**
   * Register a webhook configuration
   */
  registerConfig(id: string, config: WebhookConfig): void {
    this.configs.set(id, config);
  }

  /**
   * Unregister a webhook configuration
   */
  unregisterConfig(id: string): boolean {
    return this.configs.delete(id);
  }

  /**
   * Get all configurations
   */
  getConfigs(): WebhookConfig[] {
    return Array.from(this.configs.values());
  }

  /**
   * Register an event handler
   */
  on(event: WebhookEvent, handler: WebhookHandler): void {
    const handlers = this.handlers.get(event) || new Set();
    handlers.add(handler);
    this.handlers.set(event, handlers);
  }

  /**
   * Unregister an event handler
   */
  off(event: WebhookEvent, handler: WebhookHandler): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Process an incoming webhook payload
   */
  async process(payload: WebhookPayload, secret?: string): Promise<boolean> {
    // Verify signature if secret is provided
    if (secret && payload.signature) {
      const isValid = await verifyWebhookSignatureAsync(
        JSON.stringify({ event: payload.event, timestamp: payload.timestamp, data: payload.data }),
        payload.signature,
        secret
      );

      if (!isValid) {
        console.error('Webhook signature verification failed');
        return false;
      }
    }

    // Get handlers for this event
    const handlers = this.handlers.get(payload.event);
    if (!handlers || handlers.size === 0) {
      return true; // No handlers, but not an error
    }

    // Execute handlers
    const errors: Error[] = [];
    for (const handler of handlers) {
      try {
        await handler(payload);
      } catch (error) {
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }

    if (errors.length > 0) {
      console.error('Webhook handler errors:', errors);
      return false;
    }

    return true;
  }

  /**
   * Dispatch a webhook to configured endpoints
   */
  async dispatch(event: WebhookEvent, data: Record<string, unknown>): Promise<{
    sent: number;
    failed: number;
    errors: string[];
  }> {
    const results = { sent: 0, failed: 0, errors: [] as string[] };

    for (const config of this.configs.values()) {
      if (!config.active || !config.events.includes(event)) {
        continue;
      }

      try {
        const payload = createWebhookPayload(event, data, config.secret);

        const response = await fetch(config.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Event': event,
            'X-Webhook-Timestamp': payload.timestamp,
            ...(payload.signature ? { 'X-Webhook-Signature': payload.signature } : {}),
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push(`${config.url}: HTTP ${response.status}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`${config.url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  }

  /**
   * Clear all handlers
   */
  clearHandlers(): void {
    this.handlers.clear();
  }

  /**
   * Clear all configurations
   */
  clearConfigs(): void {
    this.configs.clear();
  }
}

/**
 * Create a webhook manager instance
 */
export function createWebhookManager(): WebhookManager {
  return new WebhookManager();
}

/**
 * Default webhook manager instance
 */
let defaultWebhookManager: WebhookManager | null = null;

/**
 * Get the default webhook manager
 */
export function getWebhookManager(): WebhookManager {
  if (!defaultWebhookManager) {
    defaultWebhookManager = new WebhookManager();
  }
  return defaultWebhookManager;
}

/**
 * Express/Koa middleware helper for webhook endpoint
 */
export function createWebhookMiddleware(
  manager: WebhookManager,
  secret?: string
): (req: { body: WebhookPayload }, res: { status: (code: number) => { json: (data: unknown) => void } }) => Promise<void> {
  return async (req, res) => {
    try {
      const payload = req.body;

      if (!payload.event || !payload.timestamp) {
        res.status(400).json({ error: 'Invalid webhook payload' });
        return;
      }

      const success = await manager.process(payload, secret);

      if (success) {
        res.status(200).json({ received: true });
      } else {
        res.status(500).json({ error: 'Webhook processing failed' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Webhook event descriptions
 */
export const WEBHOOK_EVENT_DESCRIPTIONS: Record<WebhookEvent, string> = {
  'analysis.started': 'Triggered when a new genome analysis begins',
  'analysis.progress': 'Triggered periodically during analysis with progress updates',
  'analysis.completed': 'Triggered when genome analysis completes successfully',
  'analysis.failed': 'Triggered when genome analysis fails',
  'report.generated': 'Triggered when a report is successfully generated',
};

/**
 * Get webhook event description
 */
export function getWebhookEventDescription(event: WebhookEvent): string {
  return WEBHOOK_EVENT_DESCRIPTIONS[event] || 'Unknown event';
}
