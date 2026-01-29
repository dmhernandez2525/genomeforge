/**
 * @genomeforge/i18n
 *
 * Internationalization (i18n) support for GenomeForge.
 *
 * @example
 * ```typescript
 * import { createI18n, t } from '@genomeforge/i18n';
 *
 * // Create instance with config
 * const i18n = createI18n({
 *   defaultLocale: 'en',
 *   supportedLocales: ['en', 'es', 'fr'],
 * });
 *
 * // Change locale
 * i18n.setLocale('es');
 *
 * // Translate
 * const message = i18n.t('common.welcome');
 *
 * // With interpolation
 * const greeting = i18n.t('common.hello', { name: 'World' });
 *
 * // With pluralization
 * const count = i18n.t('items', { count: 5 }, { count: 5 });
 *
 * // Shorthand (uses default instance)
 * const text = t('common.save');
 * ```
 *
 * @packageDocumentation
 */

// Types
export * from './types';

// Core i18n module
export {
  I18nManager,
  LOCALE_METADATA,
  createI18n,
  getI18n,
  setI18n,
  t,
} from './i18n';

// Locales
export { default as en } from './locales/en';
export { default as es } from './locales/es';

/**
 * Package version
 */
export const VERSION = '0.1.0';

/**
 * Default supported locales
 */
export const DEFAULT_LOCALES = ['en', 'es'] as const;
