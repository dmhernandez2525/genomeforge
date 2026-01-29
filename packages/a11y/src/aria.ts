/**
 * ARIA Utilities
 *
 * Helpers for working with ARIA attributes and roles.
 */

import type { ARIAAttributes, ARIARole, ARIARoleCategory } from './types';

/**
 * Role categories
 */
export const ROLE_CATEGORIES: Record<ARIARole, ARIARoleCategory> = {
  // Landmark roles
  banner: 'landmark',
  complementary: 'landmark',
  contentinfo: 'landmark',
  form: 'landmark',
  main: 'landmark',
  navigation: 'landmark',
  region: 'landmark',
  search: 'landmark',

  // Widget roles
  alert: 'widget',
  alertdialog: 'widget',
  button: 'widget',
  checkbox: 'widget',
  dialog: 'widget',
  gridcell: 'widget',
  link: 'widget',
  listbox: 'widget',
  menu: 'widget',
  menubar: 'widget',
  menuitem: 'widget',
  menuitemcheckbox: 'widget',
  menuitemradio: 'widget',
  option: 'widget',
  progressbar: 'widget',
  radio: 'widget',
  radiogroup: 'widget',
  scrollbar: 'widget',
  slider: 'widget',
  spinbutton: 'widget',
  status: 'live_region',
  switch: 'widget',
  tab: 'widget',
  tabpanel: 'widget',
  tablist: 'widget',
  textbox: 'widget',
  tooltip: 'widget',
  tree: 'widget',
  treeitem: 'widget',

  // Document structure roles
  article: 'document',
  cell: 'document',
  columnheader: 'document',
  definition: 'document',
  directory: 'document',
  document: 'document',
  feed: 'document',
  figure: 'document',
  group: 'document',
  heading: 'document',
  img: 'document',
  list: 'document',
  listitem: 'document',
  math: 'document',
  note: 'document',
  presentation: 'document',
  row: 'document',
  rowgroup: 'document',
  rowheader: 'document',
  separator: 'document',
  table: 'document',
  term: 'document',
  toolbar: 'document',
};

/**
 * Roles that require specific parent roles
 */
export const REQUIRED_PARENT_ROLES: Partial<Record<ARIARole, ARIARole[]>> = {
  cell: ['row'],
  columnheader: ['row'],
  gridcell: ['row'],
  listitem: ['list', 'directory'],
  menuitem: ['menu', 'menubar'],
  menuitemcheckbox: ['menu', 'menubar'],
  menuitemradio: ['menu', 'menubar'],
  option: ['listbox'],
  row: ['table', 'grid', 'treegrid', 'rowgroup'],
  rowheader: ['row'],
  tab: ['tablist'],
  treeitem: ['tree', 'group'],
};

/**
 * Roles that require aria-label or aria-labelledby
 */
export const ROLES_REQUIRING_NAME: ARIARole[] = [
  'alertdialog',
  'dialog',
  'form',
  'region',
];

/**
 * Generate ARIA attributes object
 */
export function aria(attributes: ARIAAttributes): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(attributes)) {
    if (value === undefined || value === null) continue;

    if (key === 'role') {
      result.role = value;
    } else {
      // Convert boolean to string
      if (typeof value === 'boolean') {
        result[key] = value.toString();
      } else if (typeof value === 'number') {
        result[key] = value.toString();
      } else {
        result[key] = value;
      }
    }
  }

  return result;
}

/**
 * Create ARIA props for a button
 */
export function ariaButton(options: {
  label?: string;
  pressed?: boolean;
  expanded?: boolean;
  controls?: string;
  haspopup?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  disabled?: boolean;
}): ARIAAttributes {
  return {
    role: 'button',
    'aria-label': options.label,
    'aria-pressed': options.pressed,
    'aria-expanded': options.expanded,
    'aria-controls': options.controls,
    'aria-haspopup': options.haspopup,
    'aria-disabled': options.disabled,
  };
}

/**
 * Create ARIA props for a checkbox
 */
export function ariaCheckbox(options: {
  label?: string;
  checked: boolean | 'mixed';
  disabled?: boolean;
}): ARIAAttributes {
  return {
    role: 'checkbox',
    'aria-label': options.label,
    'aria-checked': options.checked,
    'aria-disabled': options.disabled,
  };
}

/**
 * Create ARIA props for a switch
 */
export function ariaSwitch(options: {
  label?: string;
  checked: boolean;
  disabled?: boolean;
}): ARIAAttributes {
  return {
    role: 'switch',
    'aria-label': options.label,
    'aria-checked': options.checked,
    'aria-disabled': options.disabled,
  };
}

/**
 * Create ARIA props for a slider/range
 */
export function ariaSlider(options: {
  label?: string;
  value: number;
  min: number;
  max: number;
  valueText?: string;
  orientation?: 'horizontal' | 'vertical';
  disabled?: boolean;
}): ARIAAttributes {
  return {
    role: 'slider',
    'aria-label': options.label,
    'aria-valuenow': options.value,
    'aria-valuemin': options.min,
    'aria-valuemax': options.max,
    'aria-valuetext': options.valueText,
    'aria-orientation': options.orientation,
    'aria-disabled': options.disabled,
  };
}

/**
 * Create ARIA props for a progress bar
 */
export function ariaProgressbar(options: {
  label?: string;
  value?: number;
  min?: number;
  max?: number;
  valueText?: string;
}): ARIAAttributes {
  return {
    role: 'progressbar',
    'aria-label': options.label,
    'aria-valuenow': options.value,
    'aria-valuemin': options.min ?? 0,
    'aria-valuemax': options.max ?? 100,
    'aria-valuetext': options.valueText,
  };
}

/**
 * Create ARIA props for a dialog
 */
export function ariaDialog(options: {
  label?: string;
  labelledby?: string;
  describedby?: string;
  modal?: boolean;
}): ARIAAttributes {
  return {
    role: 'dialog',
    'aria-label': options.label,
    'aria-labelledby': options.labelledby,
    'aria-describedby': options.describedby,
    'aria-modal': options.modal,
  };
}

/**
 * Create ARIA props for an alert dialog
 */
export function ariaAlertDialog(options: {
  label?: string;
  labelledby?: string;
  describedby?: string;
}): ARIAAttributes {
  return {
    role: 'alertdialog',
    'aria-label': options.label,
    'aria-labelledby': options.labelledby,
    'aria-describedby': options.describedby,
    'aria-modal': true,
  };
}

/**
 * Create ARIA props for a menu
 */
export function ariaMenu(options: {
  label?: string;
  orientation?: 'horizontal' | 'vertical';
}): ARIAAttributes {
  return {
    role: 'menu',
    'aria-label': options.label,
    'aria-orientation': options.orientation || 'vertical',
  };
}

/**
 * Create ARIA props for a menu item
 */
export function ariaMenuItem(options: {
  disabled?: boolean;
  expanded?: boolean;
  haspopup?: boolean | 'menu';
}): ARIAAttributes {
  return {
    role: 'menuitem',
    'aria-disabled': options.disabled,
    'aria-expanded': options.expanded,
    'aria-haspopup': options.haspopup,
  };
}

/**
 * Create ARIA props for a listbox
 */
export function ariaListbox(options: {
  label?: string;
  multiselectable?: boolean;
  orientation?: 'horizontal' | 'vertical';
}): ARIAAttributes {
  return {
    role: 'listbox',
    'aria-label': options.label,
    'aria-multiselectable': options.multiselectable,
    'aria-orientation': options.orientation,
  };
}

/**
 * Create ARIA props for a listbox option
 */
export function ariaOption(options: {
  selected?: boolean;
  disabled?: boolean;
  posinset?: number;
  setsize?: number;
}): ARIAAttributes {
  return {
    role: 'option',
    'aria-selected': options.selected,
    'aria-disabled': options.disabled,
    'aria-posinset': options.posinset,
    'aria-setsize': options.setsize,
  };
}

/**
 * Create ARIA props for a tab
 */
export function ariaTab(options: {
  selected: boolean;
  controls: string;
  disabled?: boolean;
}): ARIAAttributes {
  return {
    role: 'tab',
    'aria-selected': options.selected,
    'aria-controls': options.controls,
    'aria-disabled': options.disabled,
  };
}

/**
 * Create ARIA props for a tab panel
 */
export function ariaTabPanel(options: {
  labelledby: string;
  hidden?: boolean;
}): ARIAAttributes {
  return {
    role: 'tabpanel',
    'aria-labelledby': options.labelledby,
    'aria-hidden': options.hidden,
  };
}

/**
 * Create ARIA props for a table
 */
export function ariaTable(options: {
  label?: string;
  rowcount?: number;
  colcount?: number;
}): ARIAAttributes {
  return {
    role: 'table',
    'aria-label': options.label,
    'aria-rowcount': options.rowcount,
  };
}

/**
 * Create ARIA props for a live region
 */
export function ariaLive(options: {
  live: 'off' | 'polite' | 'assertive';
  atomic?: boolean;
  relevant?: string;
}): ARIAAttributes {
  return {
    'aria-live': options.live,
    'aria-atomic': options.atomic,
    'aria-relevant': options.relevant,
  };
}

/**
 * Create ARIA props for an expanded section
 */
export function ariaExpanded(options: {
  expanded: boolean;
  controls?: string;
}): ARIAAttributes {
  return {
    'aria-expanded': options.expanded,
    'aria-controls': options.controls,
  };
}

/**
 * Generate unique ID
 */
export function generateId(prefix: string = 'a11y'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create linked IDs for label relationships
 */
export function createLabelIds(prefix: string): {
  labelId: string;
  inputId: string;
  descriptionId: string;
  errorId: string;
} {
  const base = generateId(prefix);
  return {
    labelId: `${base}-label`,
    inputId: `${base}-input`,
    descriptionId: `${base}-desc`,
    errorId: `${base}-error`,
  };
}
