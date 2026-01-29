/**
 * Screen Reader Announcer
 *
 * Live region utilities for screen reader announcements.
 */

import type { AnnouncementPoliteness, AnnouncementOptions } from './types';

/**
 * Live region container IDs
 */
const LIVE_REGION_IDS = {
  polite: 'a11y-announcer-polite',
  assertive: 'a11y-announcer-assertive',
};

/**
 * Create a live region element
 */
function createLiveRegion(politeness: AnnouncementPoliteness): HTMLElement {
  const id = politeness === 'assertive' ? LIVE_REGION_IDS.assertive : LIVE_REGION_IDS.polite;

  // Check if already exists
  let region = document.getElementById(id);
  if (region) return region;

  // Create new region
  region = document.createElement('div');
  region.id = id;
  region.setAttribute('aria-live', politeness);
  region.setAttribute('aria-atomic', 'true');
  region.setAttribute('role', politeness === 'assertive' ? 'alert' : 'status');

  // Visually hide but keep accessible
  Object.assign(region.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0',
  });

  document.body.appendChild(region);
  return region;
}

/**
 * Announce message to screen readers
 */
export function announce(message: string, options?: AnnouncementOptions): void {
  const politeness = options?.politeness || 'polite';
  const timeout = options?.timeout ?? 1000;
  const clearFirst = options?.clearFirst ?? true;

  if (politeness === 'off') return;

  const region = createLiveRegion(politeness);

  // Clear existing content first
  if (clearFirst) {
    region.textContent = '';
  }

  // Small delay to ensure screen reader picks up the change
  requestAnimationFrame(() => {
    region.textContent = message;

    // Clear after timeout
    if (timeout > 0) {
      setTimeout(() => {
        region.textContent = '';
      }, timeout);
    }
  });
}

/**
 * Announce politely (non-interrupting)
 */
export function announcePolitely(message: string, timeout?: number): void {
  announce(message, { politeness: 'polite', timeout });
}

/**
 * Announce assertively (interrupting)
 */
export function announceAssertively(message: string, timeout?: number): void {
  announce(message, { politeness: 'assertive', timeout });
}

/**
 * Clear all announcements
 */
export function clearAnnouncements(): void {
  const politeRegion = document.getElementById(LIVE_REGION_IDS.polite);
  const assertiveRegion = document.getElementById(LIVE_REGION_IDS.assertive);

  if (politeRegion) politeRegion.textContent = '';
  if (assertiveRegion) assertiveRegion.textContent = '';
}

/**
 * Initialize live regions on page load
 */
export function initializeLiveRegions(): void {
  createLiveRegion('polite');
  createLiveRegion('assertive');
}

/**
 * Remove live regions from DOM
 */
export function destroyLiveRegions(): void {
  const politeRegion = document.getElementById(LIVE_REGION_IDS.polite);
  const assertiveRegion = document.getElementById(LIVE_REGION_IDS.assertive);

  if (politeRegion) politeRegion.remove();
  if (assertiveRegion) assertiveRegion.remove();
}

/**
 * Announce loading state
 */
export function announceLoading(isLoading: boolean, customMessage?: string): void {
  if (isLoading) {
    announce(customMessage || 'Loading, please wait...', { politeness: 'polite' });
  } else {
    announce(customMessage || 'Loading complete', { politeness: 'polite' });
  }
}

/**
 * Announce error
 */
export function announceError(error: string): void {
  announce(`Error: ${error}`, { politeness: 'assertive' });
}

/**
 * Announce success
 */
export function announceSuccess(message: string): void {
  announce(message, { politeness: 'polite' });
}

/**
 * Announce navigation
 */
export function announceNavigation(pageName: string): void {
  announce(`Navigated to ${pageName}`, { politeness: 'polite' });
}

/**
 * Announce page update (e.g., after filtering)
 */
export function announcePageUpdate(message: string): void {
  announce(message, { politeness: 'polite', timeout: 2000 });
}

/**
 * Create an announcer instance for a specific context
 */
export class Announcer {
  private defaultPoliteness: AnnouncementPoliteness;
  private prefix: string;

  constructor(options?: { defaultPoliteness?: AnnouncementPoliteness; prefix?: string }) {
    this.defaultPoliteness = options?.defaultPoliteness || 'polite';
    this.prefix = options?.prefix || '';
  }

  /**
   * Announce a message
   */
  announce(message: string, options?: AnnouncementOptions): void {
    const fullMessage = this.prefix ? `${this.prefix}: ${message}` : message;
    announce(fullMessage, {
      politeness: this.defaultPoliteness,
      ...options,
    });
  }

  /**
   * Announce politely
   */
  polite(message: string): void {
    this.announce(message, { politeness: 'polite' });
  }

  /**
   * Announce assertively
   */
  assertive(message: string): void {
    this.announce(message, { politeness: 'assertive' });
  }

  /**
   * Announce loading state
   */
  loading(isLoading: boolean): void {
    announceLoading(isLoading);
  }

  /**
   * Announce error
   */
  error(error: string): void {
    announceError(error);
  }

  /**
   * Announce success
   */
  success(message: string): void {
    announceSuccess(message);
  }
}

/**
 * Create an announcer instance
 */
export function createAnnouncer(options?: {
  defaultPoliteness?: AnnouncementPoliteness;
  prefix?: string;
}): Announcer {
  return new Announcer(options);
}
