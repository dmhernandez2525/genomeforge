/**
 * Accessibility Types
 *
 * Type definitions for WCAG 2.1 AA accessibility compliance.
 */

/**
 * WCAG conformance levels
 */
export type WCAGLevel = 'A' | 'AA' | 'AAA';

/**
 * WCAG principles
 */
export type WCAGPrinciple = 'perceivable' | 'operable' | 'understandable' | 'robust';

/**
 * Color contrast ratio requirements
 */
export interface ContrastRequirements {
  /** Normal text minimum contrast */
  normalText: number;
  /** Large text minimum contrast (18pt+, or 14pt bold) */
  largeText: number;
  /** UI components and graphical objects */
  uiComponents: number;
}

/**
 * WCAG level contrast requirements
 */
export const CONTRAST_REQUIREMENTS: Record<WCAGLevel, ContrastRequirements> = {
  A: { normalText: 3, largeText: 3, uiComponents: 3 },
  AA: { normalText: 4.5, largeText: 3, uiComponents: 3 },
  AAA: { normalText: 7, largeText: 4.5, uiComponents: 3 },
};

/**
 * ARIA role categories
 */
export type ARIARoleCategory =
  | 'abstract'
  | 'widget'
  | 'document'
  | 'landmark'
  | 'live_region'
  | 'window';

/**
 * Common ARIA roles
 */
export type ARIARole =
  // Landmark roles
  | 'banner'
  | 'complementary'
  | 'contentinfo'
  | 'form'
  | 'main'
  | 'navigation'
  | 'region'
  | 'search'
  // Widget roles
  | 'alert'
  | 'alertdialog'
  | 'button'
  | 'checkbox'
  | 'dialog'
  | 'grid'
  | 'gridcell'
  | 'link'
  | 'listbox'
  | 'menu'
  | 'menubar'
  | 'menuitem'
  | 'menuitemcheckbox'
  | 'menuitemradio'
  | 'option'
  | 'progressbar'
  | 'radio'
  | 'radiogroup'
  | 'scrollbar'
  | 'slider'
  | 'spinbutton'
  | 'status'
  | 'switch'
  | 'tab'
  | 'tabpanel'
  | 'tablist'
  | 'textbox'
  | 'tooltip'
  | 'tree'
  | 'treegrid'
  | 'treeitem'
  // Document structure roles
  | 'article'
  | 'cell'
  | 'columnheader'
  | 'definition'
  | 'directory'
  | 'document'
  | 'feed'
  | 'figure'
  | 'group'
  | 'heading'
  | 'img'
  | 'list'
  | 'listitem'
  | 'math'
  | 'note'
  | 'presentation'
  | 'row'
  | 'rowgroup'
  | 'rowheader'
  | 'separator'
  | 'table'
  | 'term'
  | 'toolbar';

/**
 * ARIA state properties
 */
export interface ARIAState {
  /** Whether element is busy/loading */
  'aria-busy'?: boolean;
  /** Whether element is checked */
  'aria-checked'?: boolean | 'mixed';
  /** Whether element is disabled */
  'aria-disabled'?: boolean;
  /** Whether element is expanded */
  'aria-expanded'?: boolean;
  /** Whether element is grabbed (drag and drop) */
  'aria-grabbed'?: boolean;
  /** Whether element is hidden */
  'aria-hidden'?: boolean;
  /** Whether element has invalid input */
  'aria-invalid'?: boolean | 'grammar' | 'spelling';
  /** Whether element is pressed */
  'aria-pressed'?: boolean | 'mixed';
  /** Whether element is selected */
  'aria-selected'?: boolean;
}

/**
 * ARIA property attributes
 */
export interface ARIAProperty {
  /** ID of active descendant */
  'aria-activedescendant'?: string;
  /** Atomic live region updates */
  'aria-atomic'?: boolean;
  /** Autocomplete behavior */
  'aria-autocomplete'?: 'none' | 'inline' | 'list' | 'both';
  /** ID of element that controls this one */
  'aria-controls'?: string;
  /** Current item in set */
  'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
  /** ID of element described by */
  'aria-describedby'?: string;
  /** ID of element with details */
  'aria-details'?: string;
  /** ID of error message element */
  'aria-errormessage'?: string;
  /** ID of element that element flows to */
  'aria-flowto'?: string;
  /** Whether element has popup */
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  /** Key shortcuts */
  'aria-keyshortcuts'?: string;
  /** Label text */
  'aria-label'?: string;
  /** ID of labelling element */
  'aria-labelledby'?: string;
  /** Hierarchical level */
  'aria-level'?: number;
  /** Live region politeness */
  'aria-live'?: 'off' | 'polite' | 'assertive';
  /** Whether element is modal */
  'aria-modal'?: boolean;
  /** Whether multi-line input */
  'aria-multiline'?: boolean;
  /** Whether multi-select */
  'aria-multiselectable'?: boolean;
  /** Orientation */
  'aria-orientation'?: 'horizontal' | 'vertical';
  /** ID of element this element owns */
  'aria-owns'?: string;
  /** Placeholder text */
  'aria-placeholder'?: string;
  /** Position in set */
  'aria-posinset'?: number;
  /** Whether readonly */
  'aria-readonly'?: boolean;
  /** Live region relevance */
  'aria-relevant'?: string;
  /** Whether required */
  'aria-required'?: boolean;
  /** Role description */
  'aria-roledescription'?: string;
  /** Number of rows */
  'aria-rowcount'?: number;
  /** Row index */
  'aria-rowindex'?: number;
  /** Row span */
  'aria-rowspan'?: number;
  /** Size of set */
  'aria-setsize'?: number;
  /** Sort direction */
  'aria-sort'?: 'none' | 'ascending' | 'descending' | 'other';
  /** Current value (range) */
  'aria-valuenow'?: number;
  /** Minimum value (range) */
  'aria-valuemin'?: number;
  /** Maximum value (range) */
  'aria-valuemax'?: number;
  /** Value text */
  'aria-valuetext'?: string;
}

/**
 * Complete ARIA attributes
 */
export interface ARIAAttributes extends ARIAState, ARIAProperty {
  role?: ARIARole;
}

/**
 * Accessibility preferences
 */
export interface A11yPreferences {
  /** Reduce motion animations */
  reduceMotion: boolean;
  /** High contrast mode */
  highContrast: boolean;
  /** Large text mode */
  largeText: boolean;
  /** Screen reader active */
  screenReader: boolean;
  /** Prefer reduced transparency */
  reduceTransparency: boolean;
  /** Invert colors */
  invertColors: boolean;
}

/**
 * Focus management options
 */
export interface FocusOptions {
  /** Prevent scroll on focus */
  preventScroll?: boolean;
  /** Focus visible indicator */
  focusVisible?: boolean;
}

/**
 * Keyboard navigation config
 */
export interface KeyboardNavConfig {
  /** Trap focus within container */
  trapFocus?: boolean;
  /** Restore focus on unmount */
  restoreFocus?: boolean;
  /** Auto-focus first item */
  autoFocus?: boolean;
  /** Allow arrow key navigation */
  arrowKeys?: boolean;
  /** Allow tab navigation */
  tabNavigation?: boolean;
  /** Allow escape to close */
  escapeToClose?: boolean;
  /** Wrap around on boundaries */
  wrap?: boolean;
}

/**
 * Skip link configuration
 */
export interface SkipLinkConfig {
  /** Target element ID */
  targetId: string;
  /** Skip link text */
  text: string;
  /** CSS class for styling */
  className?: string;
}

/**
 * Accessibility audit result
 */
export interface A11yAuditResult {
  /** Whether audit passed */
  passed: boolean;
  /** Violations found */
  violations: A11yViolation[];
  /** Warnings (non-critical) */
  warnings: A11yWarning[];
  /** Passed checks */
  passes: A11yPass[];
  /** Timestamp of audit */
  timestamp: string;
  /** WCAG level tested */
  level: WCAGLevel;
}

/**
 * Accessibility violation
 */
export interface A11yViolation {
  /** Rule ID */
  id: string;
  /** Rule description */
  description: string;
  /** Impact severity */
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  /** WCAG criteria */
  wcag: string[];
  /** Affected elements (selectors) */
  elements: string[];
  /** How to fix */
  help: string;
  /** Help URL */
  helpUrl?: string;
}

/**
 * Accessibility warning
 */
export interface A11yWarning {
  /** Rule ID */
  id: string;
  /** Warning description */
  description: string;
  /** Affected elements */
  elements: string[];
  /** Recommendation */
  recommendation: string;
}

/**
 * Passed accessibility check
 */
export interface A11yPass {
  /** Rule ID */
  id: string;
  /** Rule description */
  description: string;
}

/**
 * Screen reader announcement types
 */
export type AnnouncementPoliteness = 'off' | 'polite' | 'assertive';

/**
 * Announcement options
 */
export interface AnnouncementOptions {
  /** Politeness level */
  politeness?: AnnouncementPoliteness;
  /** Timeout before clearing */
  timeout?: number;
  /** Clear existing announcements first */
  clearFirst?: boolean;
}

/**
 * Color for contrast checking
 */
export interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

/**
 * Contrast check result
 */
export interface ContrastResult {
  /** Calculated contrast ratio */
  ratio: number;
  /** Whether passes AA for normal text */
  passesAA: boolean;
  /** Whether passes AA for large text */
  passesAALarge: boolean;
  /** Whether passes AAA for normal text */
  passesAAA: boolean;
  /** Whether passes AAA for large text */
  passesAAALarge: boolean;
  /** Foreground color */
  foreground: string;
  /** Background color */
  background: string;
}
