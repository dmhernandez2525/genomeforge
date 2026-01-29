/**
 * i18n Types
 *
 * Type definitions for internationalization.
 */

/**
 * Supported locales
 */
export type SupportedLocale =
  | 'en'
  | 'es'
  | 'fr'
  | 'de'
  | 'pt'
  | 'it'
  | 'ja'
  | 'ko'
  | 'zh-CN'
  | 'zh-TW'
  | 'ar'
  | 'hi';

/**
 * Locale metadata
 */
export interface LocaleMetadata {
  /** Locale code */
  code: SupportedLocale;
  /** Native name */
  name: string;
  /** English name */
  englishName: string;
  /** Text direction */
  direction: 'ltr' | 'rtl';
  /** Date format */
  dateFormat: string;
  /** Number decimal separator */
  decimalSeparator: string;
  /** Number thousands separator */
  thousandsSeparator: string;
}

/**
 * Translation namespace
 */
export type TranslationNamespace =
  | 'common'
  | 'clinical'
  | 'drugs'
  | 'traits'
  | 'reports'
  | 'settings'
  | 'errors'
  | 'validation';

/**
 * Translation key paths (for type safety)
 */
export type TranslationKey = string;

/**
 * Interpolation values
 */
export type InterpolationValues = Record<string, string | number>;

/**
 * Plural forms
 */
export interface PluralForms {
  zero?: string;
  one: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

/**
 * Translation value (can be string, plural forms, or nested object)
 */
export type TranslationValue =
  | string
  | PluralForms
  | { [key: string]: TranslationValue };

/**
 * Translations object
 */
export type Translations = Record<string, TranslationValue>;

/**
 * Locale translations
 */
export interface LocaleTranslations {
  /** Locale code */
  locale: SupportedLocale;
  /** Namespace */
  namespace: TranslationNamespace;
  /** Translations */
  translations: Translations;
}

/**
 * i18n configuration
 */
export interface I18nConfig {
  /** Default locale */
  defaultLocale: SupportedLocale;
  /** Fallback locale */
  fallbackLocale: SupportedLocale;
  /** Supported locales */
  supportedLocales: SupportedLocale[];
  /** Default namespace */
  defaultNamespace: TranslationNamespace;
  /** Load namespace automatically */
  autoLoadNamespaces?: TranslationNamespace[];
  /** Debug mode */
  debug?: boolean;
  /** Missing key handler */
  onMissingKey?: (key: string, locale: string, namespace: string) => void;
}

/**
 * i18n event types
 */
export type I18nEventType =
  | 'locale_changed'
  | 'namespace_loaded'
  | 'missing_key'
  | 'translation_error';

/**
 * i18n event
 */
export interface I18nEvent {
  /** Event type */
  type: I18nEventType;
  /** Timestamp */
  timestamp: string;
  /** Event data */
  data?: Record<string, unknown>;
}

/**
 * i18n event listener
 */
export type I18nEventListener = (event: I18nEvent) => void;

/**
 * Date/time format options
 */
export interface DateTimeFormatOptions {
  /** Date style */
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  /** Time style */
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
  /** Custom format pattern */
  pattern?: string;
}

/**
 * Number format options
 */
export interface NumberFormatOptions {
  /** Style */
  style?: 'decimal' | 'currency' | 'percent' | 'unit';
  /** Currency code */
  currency?: string;
  /** Unit */
  unit?: string;
  /** Minimum fraction digits */
  minimumFractionDigits?: number;
  /** Maximum fraction digits */
  maximumFractionDigits?: number;
  /** Use grouping */
  useGrouping?: boolean;
}
