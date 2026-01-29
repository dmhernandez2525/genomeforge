/**
 * @genomeforge/a11y
 *
 * Accessibility utilities for WCAG 2.1 AA compliance.
 *
 * @example
 * ```typescript
 * import {
 *   checkContrast,
 *   createFocusTrap,
 *   announce,
 *   aria,
 * } from '@genomeforge/a11y';
 *
 * // Check color contrast
 * const result = checkContrast('#333333', '#ffffff');
 * console.log(result.passesAA); // true
 *
 * // Create focus trap for modal
 * const trap = createFocusTrap(modalElement);
 * trap.activate();
 *
 * // Announce to screen readers
 * announce('Loading complete', { politeness: 'polite' });
 *
 * // Generate ARIA attributes
 * const buttonProps = aria({ role: 'button', 'aria-pressed': true });
 * ```
 *
 * @packageDocumentation
 */

// Types
export * from './types';

// Color contrast utilities
export {
  parseColor,
  colorToHex,
  getRelativeLuminance,
  getContrastRatio,
  checkContrast,
  meetsContrastRequirements,
  findAccessibleColor,
  suggestAccessibleColors,
} from './contrast';

// Focus management
export {
  FOCUSABLE_SELECTORS,
  TABBABLE_SELECTORS,
  isFocusable,
  isVisible,
  getFocusableElements,
  getTabbableElements,
  getFirstFocusable,
  getLastFocusable,
  focusElement,
  storeFocus,
  restoreFocus,
  createFocusTrap,
  createArrowNavigation,
  setupSkipLinks,
  createRovingTabIndex,
} from './focus';

// Screen reader announcements
export {
  announce,
  announcePolitely,
  announceAssertively,
  clearAnnouncements,
  initializeLiveRegions,
  destroyLiveRegions,
  announceLoading,
  announceError,
  announceSuccess,
  announceNavigation,
  announcePageUpdate,
  Announcer,
  createAnnouncer,
} from './announcer';

// ARIA utilities
export {
  ROLE_CATEGORIES,
  REQUIRED_PARENT_ROLES,
  ROLES_REQUIRING_NAME,
  aria,
  ariaButton,
  ariaCheckbox,
  ariaSwitch,
  ariaSlider,
  ariaProgressbar,
  ariaDialog,
  ariaAlertDialog,
  ariaMenu,
  ariaMenuItem,
  ariaListbox,
  ariaOption,
  ariaTab,
  ariaTabPanel,
  ariaTable,
  ariaLive,
  ariaExpanded,
  generateId,
  createLabelIds,
} from './aria';

/**
 * Package version
 */
export const VERSION = '0.1.0';

/**
 * WCAG 2.1 AA compliance level
 */
export const WCAG_LEVEL = 'AA';
