/**
 * Lazy Loading Utilities
 *
 * Deferred loading of resources and modules.
 */

import type { LazyLoadOptions, LazyStatus, LazyState } from './types';

/**
 * Lazy loader for deferred resource loading
 */
export class LazyLoader<T> {
  private state: LazyState<T> = { status: 'idle' };
  private loader: () => Promise<T>;
  private options: Required<LazyLoadOptions>;
  private loadPromise: Promise<T> | null = null;
  private listeners: Set<(state: LazyState<T>) => void> = new Set();

  constructor(loader: () => Promise<T>, options?: LazyLoadOptions) {
    this.loader = loader;
    this.options = {
      timeout: options?.timeout ?? 30000,
      retries: options?.retries ?? 0,
      retryDelay: options?.retryDelay ?? 1000,
      priority: options?.priority ?? 'auto',
      preload: options?.preload ?? false,
    };

    if (this.options.preload) {
      this.load();
    }
  }

  /**
   * Get current state
   */
  getState(): LazyState<T> {
    return { ...this.state };
  }

  /**
   * Get current status
   */
  getStatus(): LazyStatus {
    return this.state.status;
  }

  /**
   * Check if loaded
   */
  isLoaded(): boolean {
    return this.state.status === 'loaded';
  }

  /**
   * Check if loading
   */
  isLoading(): boolean {
    return this.state.status === 'loading';
  }

  /**
   * Get data (undefined if not loaded)
   */
  getData(): T | undefined {
    return this.state.data;
  }

  /**
   * Get error (undefined if no error)
   */
  getError(): Error | undefined {
    return this.state.error;
  }

  /**
   * Load the resource
   */
  async load(): Promise<T> {
    // Return cached result
    if (this.state.status === 'loaded' && this.state.data !== undefined) {
      return this.state.data;
    }

    // Return existing promise if already loading
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.doLoad();
    return this.loadPromise;
  }

  /**
   * Internal load with retry logic
   */
  private async doLoad(): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.options.retries; attempt++) {
      try {
        this.setState({ status: 'loading', progress: 0 });

        const result = await this.loadWithTimeout();

        this.setState({ status: 'loaded', data: result, progress: 100 });
        this.loadPromise = null;
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.options.retries) {
          await this.delay(this.options.retryDelay);
        }
      }
    }

    this.setState({ status: 'error', error: lastError! });
    this.loadPromise = null;
    throw lastError;
  }

  /**
   * Load with timeout
   */
  private loadWithTimeout(): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Loading timed out'));
      }, this.options.timeout);

      this.loader()
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Reset state
   */
  reset(): void {
    this.loadPromise = null;
    this.setState({ status: 'idle' });
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: LazyState<T>) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Update state and notify listeners
   */
  private setState(state: LazyState<T>): void {
    this.state = state;
    this.listeners.forEach((listener) => listener(state));
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create a lazy loader instance
 */
export function createLazyLoader<T>(
  loader: () => Promise<T>,
  options?: LazyLoadOptions
): LazyLoader<T> {
  return new LazyLoader<T>(loader, options);
}

/**
 * Lazy import for code splitting
 */
export function lazyImport<T extends Record<string, unknown>>(
  factory: () => Promise<T>,
  options?: LazyLoadOptions
): LazyLoader<T> {
  return createLazyLoader(factory, options);
}

/**
 * Preload multiple modules
 */
export async function preloadModules<T extends Record<string, unknown>>(
  modules: Array<() => Promise<T>>
): Promise<T[]> {
  const loaders = modules.map((factory) =>
    createLazyLoader(factory, { preload: true })
  );

  return Promise.all(loaders.map((loader) => loader.load()));
}

/**
 * Lazy value wrapper
 */
export class LazyValue<T> {
  private value: T | undefined;
  private initialized = false;
  private factory: () => T;

  constructor(factory: () => T) {
    this.factory = factory;
  }

  get(): T {
    if (!this.initialized) {
      this.value = this.factory();
      this.initialized = true;
    }
    return this.value!;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  reset(): void {
    this.value = undefined;
    this.initialized = false;
  }
}

/**
 * Create a lazy value
 */
export function createLazyValue<T>(factory: () => T): LazyValue<T> {
  return new LazyValue<T>(factory);
}

/**
 * Intersection Observer based lazy loading
 */
export function createIntersectionLazy<T>(
  loader: () => Promise<T>,
  options?: {
    root?: Element | null;
    rootMargin?: string;
    threshold?: number | number[];
  }
): {
  observe: (element: Element) => void;
  unobserve: (element: Element) => void;
  disconnect: () => void;
  getLoader: () => LazyLoader<T>;
} {
  const lazyLoader = createLazyLoader(loader);

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          lazyLoader.load();
          observer.unobserve(entry.target);
        }
      }
    },
    {
      root: options?.root ?? null,
      rootMargin: options?.rootMargin ?? '0px',
      threshold: options?.threshold ?? 0,
    }
  );

  return {
    observe: (element: Element) => observer.observe(element),
    unobserve: (element: Element) => observer.unobserve(element),
    disconnect: () => observer.disconnect(),
    getLoader: () => lazyLoader,
  };
}
