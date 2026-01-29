/**
 * Webhook Utilities
 *
 * Helpers for webhook integration and verification.
 */

import type { WebhookConfig, WebhookPayload, WebhookEvent } from './types';

/**
 * Create a webhook signature
 * Uses HMAC-SHA256 for signature generation
 */
export function createWebhookSignature(
  payload: string,
  secret: string
): string {
  // In a browser environment, use SubtleCrypto
  // In Node.js, use crypto module
  // This is a simplified implementation
  const encoder = new TextEncoder();
  const data = encoder.encode(payload + secret);

  // Simple hash for demonstration - in production use proper HMAC
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return `sha256=${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

/**
 * Verify a webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = createWebhookSignature(payload, secret);
  return signature === expectedSignature;
}

/**
 * Create a webhook payload
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
      const isValid = verifyWebhookSignature(
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
