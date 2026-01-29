/**
 * Focus Management Utilities
 *
 * Keyboard navigation and focus management for accessibility.
 */

import type { FocusOptions, KeyboardNavConfig } from './types';

/**
 * Focusable element selectors
 */
export const FOCUSABLE_SELECTORS = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
  'details > summary:first-of-type',
  'audio[controls]',
  'video[controls]',
].join(', ');

/**
 * Tabbable element selectors (excludes negative tabindex)
 */
export const TABBABLE_SELECTORS = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex="0"]',
  '[contenteditable="true"]',
].join(', ');

/**
 * Check if element is focusable
 */
export function isFocusable(element: Element): boolean {
  if (!(element instanceof HTMLElement)) return false;

  // Check if element matches focusable selectors
  if (!element.matches(FOCUSABLE_SELECTORS)) return false;

  // Check visibility
  if (!isVisible(element)) return false;

  return true;
}

/**
 * Check if element is visible
 */
export function isVisible(element: HTMLElement): boolean {
  // Check computed style
  const style = getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false;
  }

  // Check if element has dimensions
  if (element.offsetWidth === 0 && element.offsetHeight === 0) {
    return false;
  }

  // Check if any ancestor is hidden
  let parent = element.parentElement;
  while (parent) {
    const parentStyle = getComputedStyle(parent);
    if (parentStyle.display === 'none' || parentStyle.visibility === 'hidden') {
      return false;
    }
    parent = parent.parentElement;
  }

  return true;
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS));
  return elements.filter((el) => isFocusable(el));
}

/**
 * Get all tabbable elements within a container
 */
export function getTabbableElements(container: HTMLElement): HTMLElement[] {
  const elements = Array.from(container.querySelectorAll<HTMLElement>(TABBABLE_SELECTORS));
  return elements.filter((el) => {
    if (!isFocusable(el)) return false;
    const tabindex = el.getAttribute('tabindex');
    return tabindex !== '-1';
  });
}

/**
 * Get first focusable element in container
 */
export function getFirstFocusable(container: HTMLElement): HTMLElement | null {
  const elements = getFocusableElements(container);
  return elements[0] || null;
}

/**
 * Get last focusable element in container
 */
export function getLastFocusable(container: HTMLElement): HTMLElement | null {
  const elements = getFocusableElements(container);
  return elements[elements.length - 1] || null;
}

/**
 * Focus an element with options
 */
export function focusElement(element: HTMLElement, options?: FocusOptions): void {
  if (!element) return;

  const focusOptions: globalThis.FocusOptions = {
    preventScroll: options?.preventScroll,
  };

  // Use focus-visible if supported
  if (options?.focusVisible) {
    element.classList.add('focus-visible');
  }

  element.focus(focusOptions);
}

/**
 * Store the previously focused element
 */
let previouslyFocusedElement: HTMLElement | null = null;

/**
 * Store current focus for later restoration
 */
export function storeFocus(): void {
  previouslyFocusedElement = document.activeElement as HTMLElement;
}

/**
 * Restore previously stored focus
 */
export function restoreFocus(options?: FocusOptions): void {
  if (previouslyFocusedElement && isFocusable(previouslyFocusedElement)) {
    focusElement(previouslyFocusedElement, options);
  }
  previouslyFocusedElement = null;
}

/**
 * Create a focus trap within a container
 */
export function createFocusTrap(container: HTMLElement, config?: KeyboardNavConfig): {
  activate: () => void;
  deactivate: () => void;
  isActive: () => boolean;
} {
  const options: KeyboardNavConfig = {
    trapFocus: true,
    restoreFocus: true,
    autoFocus: true,
    escapeToClose: true,
    wrap: true,
    ...config,
  };

  let active = false;
  let storedFocus: HTMLElement | null = null;

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!active) return;

    if (event.key === 'Tab') {
      const focusableElements = getTabbableElements(container);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab (backwards)
        if (document.activeElement === firstElement) {
          if (options.wrap) {
            event.preventDefault();
            focusElement(lastElement);
          }
        }
      } else {
        // Tab (forwards)
        if (document.activeElement === lastElement) {
          if (options.wrap) {
            event.preventDefault();
            focusElement(firstElement);
          }
        }
      }
    }

    if (event.key === 'Escape' && options.escapeToClose) {
      deactivate();
    }
  };

  const activate = () => {
    if (active) return;

    active = true;

    if (options.restoreFocus) {
      storedFocus = document.activeElement as HTMLElement;
    }

    container.addEventListener('keydown', handleKeyDown);

    if (options.autoFocus) {
      // Focus first focusable element
      const first = getFirstFocusable(container);
      if (first) {
        focusElement(first);
      }
    }
  };

  const deactivate = () => {
    if (!active) return;

    active = false;
    container.removeEventListener('keydown', handleKeyDown);

    if (options.restoreFocus && storedFocus) {
      focusElement(storedFocus);
      storedFocus = null;
    }
  };

  return {
    activate,
    deactivate,
    isActive: () => active,
  };
}

/**
 * Create arrow key navigation
 */
export function createArrowNavigation(
  container: HTMLElement,
  config?: {
    orientation?: 'horizontal' | 'vertical' | 'both';
    wrap?: boolean;
    selector?: string;
  }
): { destroy: () => void } {
  const options = {
    orientation: 'both' as const,
    wrap: true,
    selector: FOCUSABLE_SELECTORS,
    ...config,
  };

  const getNavigableElements = () => {
    return Array.from(container.querySelectorAll<HTMLElement>(options.selector)).filter(isFocusable);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const elements = getNavigableElements();
    if (elements.length === 0) return;

    const currentIndex = elements.indexOf(document.activeElement as HTMLElement);
    if (currentIndex === -1) return;

    let nextIndex: number | null = null;

    const isHorizontal = options.orientation === 'horizontal' || options.orientation === 'both';
    const isVertical = options.orientation === 'vertical' || options.orientation === 'both';

    if ((event.key === 'ArrowRight' && isHorizontal) || (event.key === 'ArrowDown' && isVertical)) {
      nextIndex = currentIndex + 1;
      if (nextIndex >= elements.length) {
        nextIndex = options.wrap ? 0 : null;
      }
    }

    if ((event.key === 'ArrowLeft' && isHorizontal) || (event.key === 'ArrowUp' && isVertical)) {
      nextIndex = currentIndex - 1;
      if (nextIndex < 0) {
        nextIndex = options.wrap ? elements.length - 1 : null;
      }
    }

    if (event.key === 'Home') {
      nextIndex = 0;
    }

    if (event.key === 'End') {
      nextIndex = elements.length - 1;
    }

    if (nextIndex !== null && elements[nextIndex]) {
      event.preventDefault();
      focusElement(elements[nextIndex]);
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  return {
    destroy: () => {
      container.removeEventListener('keydown', handleKeyDown);
    },
  };
}

/**
 * Set up skip link functionality
 */
export function setupSkipLinks(links: Array<{ element: HTMLElement; targetId: string }>): void {
  for (const { element, targetId } of links) {
    element.addEventListener('click', (event) => {
      event.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        // Make target focusable if it isn't
        if (!isFocusable(target)) {
          target.setAttribute('tabindex', '-1');
        }
        focusElement(target);
      }
    });

    element.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        element.click();
      }
    });
  }
}

/**
 * Manage roving tabindex for widget navigation
 */
export function createRovingTabIndex(
  container: HTMLElement,
  selector: string,
  initialIndex: number = 0
): {
  setActive: (index: number) => void;
  getActive: () => number;
  destroy: () => void;
} {
  const getItems = () => Array.from(container.querySelectorAll<HTMLElement>(selector));
  let activeIndex = initialIndex;

  const updateTabIndex = () => {
    const items = getItems();
    items.forEach((item, index) => {
      item.setAttribute('tabindex', index === activeIndex ? '0' : '-1');
    });
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const items = getItems();
    if (!items.length) return;

    let newIndex: number | null = null;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        newIndex = (activeIndex + 1) % items.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        newIndex = (activeIndex - 1 + items.length) % items.length;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = items.length - 1;
        break;
    }

    if (newIndex !== null) {
      event.preventDefault();
      activeIndex = newIndex;
      updateTabIndex();
      focusElement(items[activeIndex]);
    }
  };

  // Initialize
  updateTabIndex();
  container.addEventListener('keydown', handleKeyDown);

  return {
    setActive: (index: number) => {
      activeIndex = index;
      updateTabIndex();
    },
    getActive: () => activeIndex,
    destroy: () => {
      container.removeEventListener('keydown', handleKeyDown);
    },
  };
}
