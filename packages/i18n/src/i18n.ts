/**
 * i18n Core Module
 *
 * Internationalization engine for GenomeForge.
 */

import type {
  SupportedLocale,
  LocaleMetadata,
  TranslationNamespace,
  Translations,
  TranslationValue,
  PluralForms,
  InterpolationValues,
  I18nConfig,
  I18nEvent,
  I18nEventType,
  I18nEventListener,
  DateTimeFormatOptions,
  NumberFormatOptions,
} from './types';

// Import default locales
import en from './locales/en';
import es from './locales/es';

/**
 * Locale metadata definitions
 */
export const LOCALE_METADATA: Record<SupportedLocale, LocaleMetadata> = {
  en: {
    code: 'en',
    name: 'English',
    englishName: 'English',
    direction: 'ltr',
    dateFormat: 'MM/DD/YYYY',
    decimalSeparator: '.',
    thousandsSeparator: ',',
  },
  es: {
    code: 'es',
    name: 'Español',
    englishName: 'Spanish',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    decimalSeparator: ',',
    thousandsSeparator: '.',
  },
  fr: {
    code: 'fr',
    name: 'Français',
    englishName: 'French',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    decimalSeparator: ',',
    thousandsSeparator: ' ',
  },
  de: {
    code: 'de',
    name: 'Deutsch',
    englishName: 'German',
    direction: 'ltr',
    dateFormat: 'DD.MM.YYYY',
    decimalSeparator: ',',
    thousandsSeparator: '.',
  },
  pt: {
    code: 'pt',
    name: 'Português',
    englishName: 'Portuguese',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    decimalSeparator: ',',
    thousandsSeparator: '.',
  },
  it: {
    code: 'it',
    name: 'Italiano',
    englishName: 'Italian',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    decimalSeparator: ',',
    thousandsSeparator: '.',
  },
  ja: {
    code: 'ja',
    name: '日本語',
    englishName: 'Japanese',
    direction: 'ltr',
    dateFormat: 'YYYY/MM/DD',
    decimalSeparator: '.',
    thousandsSeparator: ',',
  },
  ko: {
    code: 'ko',
    name: '한국어',
    englishName: 'Korean',
    direction: 'ltr',
    dateFormat: 'YYYY.MM.DD',
    decimalSeparator: '.',
    thousandsSeparator: ',',
  },
  'zh-CN': {
    code: 'zh-CN',
    name: '简体中文',
    englishName: 'Chinese (Simplified)',
    direction: 'ltr',
    dateFormat: 'YYYY-MM-DD',
    decimalSeparator: '.',
    thousandsSeparator: ',',
  },
  'zh-TW': {
    code: 'zh-TW',
    name: '繁體中文',
    englishName: 'Chinese (Traditional)',
    direction: 'ltr',
    dateFormat: 'YYYY/MM/DD',
    decimalSeparator: '.',
    thousandsSeparator: ',',
  },
  ar: {
    code: 'ar',
    name: 'العربية',
    englishName: 'Arabic',
    direction: 'rtl',
    dateFormat: 'DD/MM/YYYY',
    decimalSeparator: '٫',
    thousandsSeparator: '٬',
  },
  hi: {
    code: 'hi',
    name: 'हिन्दी',
    englishName: 'Hindi',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    decimalSeparator: '.',
    thousandsSeparator: ',',
  },
};

/**
 * Default i18n configuration
 */
const DEFAULT_CONFIG: I18nConfig = {
  defaultLocale: 'en',
  fallbackLocale: 'en',
  supportedLocales: ['en', 'es'],
  defaultNamespace: 'common',
  autoLoadNamespaces: ['common', 'errors'],
  debug: false,
};

/**
 * Built-in translations
 */
const BUILT_IN_TRANSLATIONS: Record<SupportedLocale, Record<TranslationNamespace, Translations>> = {
  en: en as Record<TranslationNamespace, Translations>,
  es: es as Record<TranslationNamespace, Translations>,
  fr: {} as Record<TranslationNamespace, Translations>,
  de: {} as Record<TranslationNamespace, Translations>,
  pt: {} as Record<TranslationNamespace, Translations>,
  it: {} as Record<TranslationNamespace, Translations>,
  ja: {} as Record<TranslationNamespace, Translations>,
  ko: {} as Record<TranslationNamespace, Translations>,
  'zh-CN': {} as Record<TranslationNamespace, Translations>,
  'zh-TW': {} as Record<TranslationNamespace, Translations>,
  ar: {} as Record<TranslationNamespace, Translations>,
  hi: {} as Record<TranslationNamespace, Translations>,
};

/**
 * i18n Manager class
 */
export class I18nManager {
  private config: I18nConfig;
  private currentLocale: SupportedLocale;
  private translations: Map<string, Translations> = new Map();
  private listeners: Set<I18nEventListener> = new Set();

  constructor(config: Partial<I18nConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.currentLocale = this.config.defaultLocale;
    this.loadBuiltInTranslations();
  }

  /**
   * Load built-in translations
   */
  private loadBuiltInTranslations(): void {
    for (const locale of this.config.supportedLocales) {
      const localeTranslations = BUILT_IN_TRANSLATIONS[locale];
      if (localeTranslations) {
        for (const [namespace, translations] of Object.entries(localeTranslations)) {
          this.setTranslations(locale, namespace as TranslationNamespace, translations);
        }
      }
    }
  }

  /**
   * Add an event listener
   */
  addEventListener(listener: I18nEventListener): void {
    this.listeners.add(listener);
  }

  /**
   * Remove an event listener
   */
  removeEventListener(listener: I18nEventListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Emit an event
   */
  private emit(type: I18nEventType, data?: Record<string, unknown>): void {
    const event: I18nEvent = {
      type,
      timestamp: new Date().toISOString(),
      data,
    };

    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('i18n event listener error:', error);
      }
    }
  }

  /**
   * Debug log
   */
  private debug(message: string, data?: unknown): void {
    if (this.config.debug) {
      console.log(`[i18n] ${message}`, data || '');
    }
  }

  /**
   * Get current locale
   */
  getLocale(): SupportedLocale {
    return this.currentLocale;
  }

  /**
   * Get locale metadata
   */
  getLocaleMetadata(locale?: SupportedLocale): LocaleMetadata {
    return LOCALE_METADATA[locale || this.currentLocale];
  }

  /**
   * Get all supported locales
   */
  getSupportedLocales(): SupportedLocale[] {
    return [...this.config.supportedLocales];
  }

  /**
   * Get all locale metadata
   */
  getAllLocaleMetadata(): LocaleMetadata[] {
    return this.config.supportedLocales.map((locale) => LOCALE_METADATA[locale]);
  }

  /**
   * Set current locale
   */
  setLocale(locale: SupportedLocale): void {
    if (!this.config.supportedLocales.includes(locale)) {
      console.warn(`Locale '${locale}' is not supported. Using fallback.`);
      locale = this.config.fallbackLocale;
    }

    const previousLocale = this.currentLocale;
    this.currentLocale = locale;

    this.emit('locale_changed', { previousLocale, newLocale: locale });
    this.debug(`Locale changed from ${previousLocale} to ${locale}`);
  }

  /**
   * Set translations for a locale and namespace
   */
  setTranslations(
    locale: SupportedLocale,
    namespace: TranslationNamespace,
    translations: Translations
  ): void {
    const key = `${locale}:${namespace}`;
    this.translations.set(key, translations);
    this.emit('namespace_loaded', { locale, namespace });
  }

  /**
   * Get translation by key
   */
  t(
    key: string,
    values?: InterpolationValues,
    options?: { namespace?: TranslationNamespace; count?: number }
  ): string {
    const namespace = options?.namespace || this.config.defaultNamespace;
    const count = options?.count;

    // Try current locale
    let translation = this.getTranslationValue(this.currentLocale, namespace, key);

    // Fallback to default locale
    if (translation === undefined && this.currentLocale !== this.config.fallbackLocale) {
      translation = this.getTranslationValue(this.config.fallbackLocale, namespace, key);
    }

    // Handle missing key
    if (translation === undefined) {
      this.handleMissingKey(key, namespace);
      return key;
    }

    // Handle plural forms
    if (typeof translation === 'object' && !Array.isArray(translation)) {
      if ('one' in translation || 'other' in translation) {
        translation = this.selectPluralForm(translation as PluralForms, count ?? 1);
      }
    }

    // Ensure string
    if (typeof translation !== 'string') {
      return key;
    }

    // Interpolate values
    if (values) {
      translation = this.interpolate(translation, values);
    }

    // Interpolate count
    if (count !== undefined) {
      translation = this.interpolate(translation, { count });
    }

    return translation;
  }

  /**
   * Get translation value from nested path
   */
  private getTranslationValue(
    locale: SupportedLocale,
    namespace: TranslationNamespace,
    key: string
  ): TranslationValue | undefined {
    const translationKey = `${locale}:${namespace}`;
    const translations = this.translations.get(translationKey);
    if (!translations) return undefined;

    const parts = key.split('.');
    let value: TranslationValue | undefined = translations;

    for (const part of parts) {
      if (typeof value === 'object' && !Array.isArray(value) && part in value) {
        value = (value as Record<string, TranslationValue>)[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Select appropriate plural form
   */
  private selectPluralForm(forms: PluralForms, count: number): string {
    // Simple plural rules (English-like)
    // For more complex rules, use Intl.PluralRules
    if (count === 0 && forms.zero) return forms.zero;
    if (count === 1 && forms.one) return forms.one;
    if (count === 2 && forms.two) return forms.two;
    return forms.other;
  }

  /**
   * Interpolate values into string
   */
  private interpolate(template: string, values: InterpolationValues): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      if (key in values) {
        return String(values[key]);
      }
      return match;
    });
  }

  /**
   * Handle missing translation key
   */
  private handleMissingKey(key: string, namespace: string): void {
    this.emit('missing_key', { key, namespace, locale: this.currentLocale });

    if (this.config.onMissingKey) {
      this.config.onMissingKey(key, this.currentLocale, namespace);
    } else if (this.config.debug) {
      console.warn(`[i18n] Missing translation: ${namespace}:${key} (${this.currentLocale})`);
    }
  }

  /**
   * Format date
   */
  formatDate(date: Date | string | number, options?: DateTimeFormatOptions): string {
    const d = date instanceof Date ? date : new Date(date);
    const locale = this.currentLocale;

    if (options?.pattern) {
      return this.formatDateWithPattern(d, options.pattern);
    }

    const intlOptions: Intl.DateTimeFormatOptions = {};
    if (options?.dateStyle) intlOptions.dateStyle = options.dateStyle;
    if (options?.timeStyle) intlOptions.timeStyle = options.timeStyle;

    if (!options?.dateStyle && !options?.timeStyle) {
      intlOptions.dateStyle = 'medium';
    }

    return new Intl.DateTimeFormat(locale, intlOptions).format(d);
  }

  /**
   * Format date with custom pattern
   */
  private formatDateWithPattern(date: Date, pattern: string): string {
    const pad = (n: number): string => n.toString().padStart(2, '0');

    const replacements: Record<string, string> = {
      YYYY: date.getFullYear().toString(),
      YY: date.getFullYear().toString().slice(-2),
      MM: pad(date.getMonth() + 1),
      DD: pad(date.getDate()),
      HH: pad(date.getHours()),
      mm: pad(date.getMinutes()),
      ss: pad(date.getSeconds()),
    };

    return pattern.replace(/YYYY|YY|MM|DD|HH|mm|ss/g, (match) => replacements[match] || match);
  }

  /**
   * Format number
   */
  formatNumber(value: number, options?: NumberFormatOptions): string {
    const locale = this.currentLocale;

    const intlOptions: Intl.NumberFormatOptions = {
      style: options?.style || 'decimal',
      currency: options?.currency,
      unit: options?.unit,
      minimumFractionDigits: options?.minimumFractionDigits,
      maximumFractionDigits: options?.maximumFractionDigits,
      useGrouping: options?.useGrouping ?? true,
    };

    return new Intl.NumberFormat(locale, intlOptions).format(value);
  }

  /**
   * Format percent
   */
  formatPercent(value: number, decimals: number = 1): string {
    return this.formatNumber(value / 100, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  /**
   * Format currency
   */
  formatCurrency(value: number, currency: string = 'USD'): string {
    return this.formatNumber(value, {
      style: 'currency',
      currency,
    });
  }

  /**
   * Format relative time
   */
  formatRelativeTime(date: Date | string | number): string {
    const d = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);

    const rtf = new Intl.RelativeTimeFormat(this.currentLocale, { numeric: 'auto' });

    if (Math.abs(diffSec) < 60) {
      return rtf.format(diffSec, 'second');
    }
    if (Math.abs(diffMin) < 60) {
      return rtf.format(diffMin, 'minute');
    }
    if (Math.abs(diffHour) < 24) {
      return rtf.format(diffHour, 'hour');
    }
    return rtf.format(diffDay, 'day');
  }

  /**
   * Get text direction
   */
  getDirection(): 'ltr' | 'rtl' {
    return this.getLocaleMetadata().direction;
  }

  /**
   * Check if current locale is RTL
   */
  isRTL(): boolean {
    return this.getDirection() === 'rtl';
  }
}

/**
 * Create i18n manager instance
 */
export function createI18n(config?: Partial<I18nConfig>): I18nManager {
  return new I18nManager(config);
}

/**
 * Default i18n instance
 */
let defaultI18n: I18nManager | null = null;

/**
 * Get default i18n instance
 */
export function getI18n(): I18nManager {
  if (!defaultI18n) {
    defaultI18n = new I18nManager();
  }
  return defaultI18n;
}

/**
 * Set default i18n instance
 */
export function setI18n(i18n: I18nManager): void {
  defaultI18n = i18n;
}

/**
 * Shorthand translation function
 */
export function t(
  key: string,
  values?: InterpolationValues,
  options?: { namespace?: TranslationNamespace; count?: number }
): string {
  return getI18n().t(key, values, options);
}
