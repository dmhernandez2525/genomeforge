/**
 * Color Contrast Utilities
 *
 * WCAG 2.1 compliant color contrast calculation and validation.
 */

import type { Color, ContrastResult, WCAGLevel, ContrastRequirements } from './types';
import { CONTRAST_REQUIREMENTS } from './types';

/**
 * Parse color string to RGB values
 */
export function parseColor(color: string): Color | null {
  // Remove whitespace
  color = color.trim();

  // Hex color
  if (color.startsWith('#')) {
    return parseHex(color);
  }

  // RGB/RGBA color
  if (color.startsWith('rgb')) {
    return parseRgb(color);
  }

  // HSL/HSLA color
  if (color.startsWith('hsl')) {
    return parseHsl(color);
  }

  // Named color
  return parseNamedColor(color);
}

/**
 * Parse hex color to RGB
 */
function parseHex(hex: string): Color | null {
  hex = hex.replace('#', '');

  // Handle shorthand (e.g., #fff)
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  // Handle with alpha (e.g., #ffffff80)
  if (hex.length === 4) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }

  if (hex.length !== 6 && hex.length !== 8) {
    return null;
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const a = hex.length === 8 ? parseInt(hex.substring(6, 8), 16) / 255 : 1;

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return null;
  }

  return { r, g, b, a };
}

/**
 * Parse RGB/RGBA string to Color
 */
function parseRgb(rgb: string): Color | null {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
  if (!match) return null;

  return {
    r: parseInt(match[1], 10),
    g: parseInt(match[2], 10),
    b: parseInt(match[3], 10),
    a: match[4] ? parseFloat(match[4]) : 1,
  };
}

/**
 * Parse HSL/HSLA string to Color
 */
function parseHsl(hsl: string): Color | null {
  const match = hsl.match(/hsla?\((\d+),\s*(\d+)%?,\s*(\d+)%?(?:,\s*([0-9.]+))?\)/);
  if (!match) return null;

  const h = parseInt(match[1], 10) / 360;
  const s = parseInt(match[2], 10) / 100;
  const l = parseInt(match[3], 10) / 100;
  const a = match[4] ? parseFloat(match[4]) : 1;

  // Convert HSL to RGB
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
    a,
  };
}

/**
 * Common named colors
 */
const NAMED_COLORS: Record<string, Color> = {
  white: { r: 255, g: 255, b: 255 },
  black: { r: 0, g: 0, b: 0 },
  red: { r: 255, g: 0, b: 0 },
  green: { r: 0, g: 128, b: 0 },
  blue: { r: 0, g: 0, b: 255 },
  yellow: { r: 255, g: 255, b: 0 },
  orange: { r: 255, g: 165, b: 0 },
  purple: { r: 128, g: 0, b: 128 },
  gray: { r: 128, g: 128, b: 128 },
  grey: { r: 128, g: 128, b: 128 },
  transparent: { r: 0, g: 0, b: 0, a: 0 },
};

/**
 * Parse named color
 */
function parseNamedColor(name: string): Color | null {
  return NAMED_COLORS[name.toLowerCase()] || null;
}

/**
 * Convert color to hex string
 */
export function colorToHex(color: Color): string {
  const r = color.r.toString(16).padStart(2, '0');
  const g = color.g.toString(16).padStart(2, '0');
  const b = color.b.toString(16).padStart(2, '0');

  if (color.a !== undefined && color.a < 1) {
    const a = Math.round(color.a * 255).toString(16).padStart(2, '0');
    return `#${r}${g}${b}${a}`;
  }

  return `#${r}${g}${b}`;
}

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 formula
 */
export function getRelativeLuminance(color: Color): number {
  const sRGB = [color.r, color.g, color.b].map((val) => {
    const srgb = val / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

/**
 * Calculate contrast ratio between two colors
 * Returns ratio as X:1 (e.g., 4.5 means 4.5:1)
 */
export function getContrastRatio(foreground: Color, background: Color): number {
  // If foreground has alpha, blend with background
  let fg = foreground;
  if (foreground.a !== undefined && foreground.a < 1) {
    fg = blendColors(foreground, background);
  }

  const l1 = getRelativeLuminance(fg);
  const l2 = getRelativeLuminance(background);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Blend foreground color with background (alpha compositing)
 */
function blendColors(foreground: Color, background: Color): Color {
  const alpha = foreground.a ?? 1;

  return {
    r: Math.round(foreground.r * alpha + background.r * (1 - alpha)),
    g: Math.round(foreground.g * alpha + background.g * (1 - alpha)),
    b: Math.round(foreground.b * alpha + background.b * (1 - alpha)),
    a: 1,
  };
}

/**
 * Check contrast ratio between two colors
 */
export function checkContrast(
  foreground: string | Color,
  background: string | Color
): ContrastResult | null {
  const fg = typeof foreground === 'string' ? parseColor(foreground) : foreground;
  const bg = typeof background === 'string' ? parseColor(background) : background;

  if (!fg || !bg) {
    return null;
  }

  const ratio = getContrastRatio(fg, bg);

  return {
    ratio: Math.round(ratio * 100) / 100,
    passesAA: ratio >= CONTRAST_REQUIREMENTS.AA.normalText,
    passesAALarge: ratio >= CONTRAST_REQUIREMENTS.AA.largeText,
    passesAAA: ratio >= CONTRAST_REQUIREMENTS.AAA.normalText,
    passesAAALarge: ratio >= CONTRAST_REQUIREMENTS.AAA.largeText,
    foreground: typeof foreground === 'string' ? foreground : colorToHex(foreground),
    background: typeof background === 'string' ? background : colorToHex(background),
  };
}

/**
 * Check if colors meet WCAG requirements
 */
export function meetsContrastRequirements(
  foreground: string | Color,
  background: string | Color,
  level: WCAGLevel = 'AA',
  isLargeText: boolean = false
): boolean {
  const result = checkContrast(foreground, background);
  if (!result) return false;

  const requirements = CONTRAST_REQUIREMENTS[level];
  const required = isLargeText ? requirements.largeText : requirements.normalText;

  return result.ratio >= required;
}

/**
 * Find a color that meets contrast requirements
 */
export function findAccessibleColor(
  baseColor: string | Color,
  background: string | Color,
  level: WCAGLevel = 'AA',
  isLargeText: boolean = false
): string | null {
  const base = typeof baseColor === 'string' ? parseColor(baseColor) : baseColor;
  const bg = typeof background === 'string' ? parseColor(background) : background;

  if (!base || !bg) return null;

  // Check if already accessible
  if (meetsContrastRequirements(base, bg, level, isLargeText)) {
    return colorToHex(base);
  }

  const requirements = CONTRAST_REQUIREMENTS[level];
  const targetRatio = isLargeText ? requirements.largeText : requirements.normalText;

  // Calculate luminance needed
  const bgLuminance = getRelativeLuminance(bg);

  // Try darkening or lightening
  const baseLuminance = getRelativeLuminance(base);
  const shouldDarken = baseLuminance > bgLuminance;

  // Binary search for accessible color
  let low = 0;
  let high = 100;
  let bestColor = base;
  let bestRatio = getContrastRatio(base, bg);

  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2;
    const adjusted = adjustLightness(base, shouldDarken ? -mid : mid);
    const ratio = getContrastRatio(adjusted, bg);

    if (ratio >= targetRatio) {
      if (ratio < bestRatio || bestRatio < targetRatio) {
        bestColor = adjusted;
        bestRatio = ratio;
      }
      if (shouldDarken) {
        low = mid;
      } else {
        high = mid;
      }
    } else {
      if (shouldDarken) {
        high = mid;
      } else {
        low = mid;
      }
    }
  }

  return bestRatio >= targetRatio ? colorToHex(bestColor) : null;
}

/**
 * Adjust lightness of a color
 */
function adjustLightness(color: Color, amount: number): Color {
  // Convert to HSL, adjust L, convert back
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  // Adjust lightness
  l = Math.max(0, Math.min(1, l + amount / 100));

  // Convert back to RGB
  if (s === 0) {
    const val = Math.round(l * 255);
    return { r: val, g: val, b: val, a: color.a };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
    a: color.a,
  };
}

/**
 * Suggest accessible color alternatives
 */
export function suggestAccessibleColors(
  foreground: string | Color,
  background: string | Color,
  level: WCAGLevel = 'AA'
): { lighter: string | null; darker: string | null; ratio: number } {
  const fg = typeof foreground === 'string' ? parseColor(foreground) : foreground;
  const bg = typeof background === 'string' ? parseColor(background) : background;

  if (!fg || !bg) {
    return { lighter: null, darker: null, ratio: 0 };
  }

  const currentRatio = getContrastRatio(fg, bg);

  // Find lighter and darker versions
  let lighter: Color | null = null;
  let darker: Color | null = null;

  for (let i = 5; i <= 100; i += 5) {
    if (!lighter) {
      const lightened = adjustLightness(fg, i);
      if (meetsContrastRequirements(lightened, bg, level)) {
        lighter = lightened;
      }
    }
    if (!darker) {
      const darkened = adjustLightness(fg, -i);
      if (meetsContrastRequirements(darkened, bg, level)) {
        darker = darkened;
      }
    }
    if (lighter && darker) break;
  }

  return {
    lighter: lighter ? colorToHex(lighter) : null,
    darker: darker ? colorToHex(darker) : null,
    ratio: Math.round(currentRatio * 100) / 100,
  };
}
