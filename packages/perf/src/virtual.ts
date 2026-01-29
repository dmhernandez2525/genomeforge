/**
 * Virtual List Utilities
 *
 * Efficient rendering of large lists with virtualization.
 */

import type { VirtualListOptions, VirtualListState } from './types';

/**
 * Virtual list for efficient large list rendering
 */
export class VirtualList<T = unknown> {
  private items: T[] = [];
  private options: Required<VirtualListOptions>;
  private state: VirtualListState;
  private listeners: Set<(state: VirtualListState) => void> = new Set();
  private itemHeights: Map<number, number> = new Map();

  constructor(items: T[], options: VirtualListOptions) {
    this.items = items;
    this.options = {
      itemHeight: options.itemHeight,
      overscan: options.overscan ?? 3,
      containerHeight: options.containerHeight ?? 400,
      estimateHeight: options.estimateHeight ?? (() => options.itemHeight),
    };

    this.state = this.calculateState(0);
  }

  /**
   * Get current state
   */
  getState(): VirtualListState {
    return { ...this.state };
  }

  /**
   * Get visible items
   */
  getVisibleItems(): Array<{ item: T; index: number; offset: number }> {
    const result: Array<{ item: T; index: number; offset: number }> = [];
    let offset = this.getOffsetForIndex(this.state.startIndex);

    for (let i = this.state.startIndex; i <= this.state.endIndex && i < this.items.length; i++) {
      result.push({
        item: this.items[i],
        index: i,
        offset,
      });
      offset += this.getItemHeight(i);
    }

    return result;
  }

  /**
   * Get item at index
   */
  getItem(index: number): T | undefined {
    return this.items[index];
  }

  /**
   * Get all items
   */
  getItems(): T[] {
    return [...this.items];
  }

  /**
   * Get item count
   */
  getItemCount(): number {
    return this.items.length;
  }

  /**
   * Update items
   */
  setItems(items: T[]): void {
    this.items = items;
    this.itemHeights.clear();
    this.updateState(this.state.scrollOffset);
  }

  /**
   * Set container height
   */
  setContainerHeight(height: number): void {
    this.options.containerHeight = height;
    this.updateState(this.state.scrollOffset);
  }

  /**
   * Handle scroll
   */
  onScroll(scrollOffset: number): void {
    this.updateState(scrollOffset);
  }

  /**
   * Scroll to index
   */
  scrollToIndex(index: number): number {
    const offset = this.getOffsetForIndex(index);
    this.updateState(offset);
    return offset;
  }

  /**
   * Scroll to top
   */
  scrollToTop(): void {
    this.updateState(0);
  }

  /**
   * Scroll to bottom
   */
  scrollToBottom(): void {
    const totalHeight = this.getTotalHeight();
    const offset = Math.max(0, totalHeight - this.options.containerHeight);
    this.updateState(offset);
  }

  /**
   * Set measured height for an item
   */
  setItemHeight(index: number, height: number): void {
    if (this.itemHeights.get(index) !== height) {
      this.itemHeights.set(index, height);
      this.updateState(this.state.scrollOffset);
    }
  }

  /**
   * Get height for item at index
   */
  getItemHeight(index: number): number {
    return this.itemHeights.get(index) ?? this.options.estimateHeight(index);
  }

  /**
   * Get total height of all items
   */
  getTotalHeight(): number {
    let total = 0;
    for (let i = 0; i < this.items.length; i++) {
      total += this.getItemHeight(i);
    }
    return total;
  }

  /**
   * Get offset for item at index
   */
  getOffsetForIndex(index: number): number {
    let offset = 0;
    for (let i = 0; i < index && i < this.items.length; i++) {
      offset += this.getItemHeight(i);
    }
    return offset;
  }

  /**
   * Get index at offset
   */
  getIndexAtOffset(offset: number): number {
    let currentOffset = 0;
    for (let i = 0; i < this.items.length; i++) {
      const itemHeight = this.getItemHeight(i);
      if (currentOffset + itemHeight > offset) {
        return i;
      }
      currentOffset += itemHeight;
    }
    return Math.max(0, this.items.length - 1);
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: VirtualListState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Calculate state based on scroll offset
   */
  private calculateState(scrollOffset: number): VirtualListState {
    const { range, visibleCount } = calculateVisibleRange(
      this.items.length,
      scrollOffset,
      this.options.containerHeight,
      (index) => this.getItemHeight(index),
      this.options.overscan
    );

    return {
      startIndex: range.start,
      endIndex: range.end,
      visibleCount,
      scrollOffset,
      totalHeight: this.getTotalHeight(),
    };
  }

  /**
   * Update state and notify listeners
   */
  private updateState(scrollOffset: number): void {
    const newState = this.calculateState(scrollOffset);

    // Only notify if state changed
    if (
      newState.startIndex !== this.state.startIndex ||
      newState.endIndex !== this.state.endIndex ||
      newState.scrollOffset !== this.state.scrollOffset ||
      newState.totalHeight !== this.state.totalHeight
    ) {
      this.state = newState;
      this.listeners.forEach((listener) => listener(this.state));
    }
  }
}

/**
 * Create a virtual list
 */
export function createVirtualList<T>(
  items: T[],
  options: VirtualListOptions
): VirtualList<T> {
  return new VirtualList<T>(items, options);
}

/**
 * Calculate visible range for virtual list
 */
export function calculateVisibleRange(
  itemCount: number,
  scrollOffset: number,
  containerHeight: number,
  getItemHeight: (index: number) => number,
  overscan: number = 3
): { range: { start: number; end: number }; visibleCount: number } {
  if (itemCount === 0) {
    return { range: { start: 0, end: 0 }, visibleCount: 0 };
  }

  // Find start index
  let offset = 0;
  let startIndex = 0;
  while (startIndex < itemCount && offset + getItemHeight(startIndex) < scrollOffset) {
    offset += getItemHeight(startIndex);
    startIndex++;
  }

  // Find end index
  let endIndex = startIndex;
  let visibleHeight = 0;
  while (endIndex < itemCount && visibleHeight < containerHeight) {
    visibleHeight += getItemHeight(endIndex);
    endIndex++;
  }

  // Apply overscan
  startIndex = Math.max(0, startIndex - overscan);
  endIndex = Math.min(itemCount - 1, endIndex + overscan);

  const visibleCount = endIndex - startIndex + 1;

  return {
    range: { start: startIndex, end: endIndex },
    visibleCount,
  };
}

/**
 * Fixed-size virtual list (simpler, more efficient)
 */
export class FixedSizeVirtualList<T = unknown> {
  private items: T[] = [];
  private itemHeight: number;
  private containerHeight: number;
  private overscan: number;
  private scrollOffset: number = 0;
  private listeners: Set<(state: VirtualListState) => void> = new Set();

  constructor(items: T[], itemHeight: number, containerHeight: number, overscan: number = 3) {
    this.items = items;
    this.itemHeight = itemHeight;
    this.containerHeight = containerHeight;
    this.overscan = overscan;
  }

  /**
   * Get state
   */
  getState(): VirtualListState {
    const visibleCount = Math.ceil(this.containerHeight / this.itemHeight);
    const startIndex = Math.max(0, Math.floor(this.scrollOffset / this.itemHeight) - this.overscan);
    const endIndex = Math.min(
      this.items.length - 1,
      startIndex + visibleCount + this.overscan * 2
    );

    return {
      startIndex,
      endIndex,
      visibleCount,
      scrollOffset: this.scrollOffset,
      totalHeight: this.items.length * this.itemHeight,
    };
  }

  /**
   * Get visible items
   */
  getVisibleItems(): Array<{ item: T; index: number; offset: number }> {
    const state = this.getState();
    const result: Array<{ item: T; index: number; offset: number }> = [];

    for (let i = state.startIndex; i <= state.endIndex && i < this.items.length; i++) {
      result.push({
        item: this.items[i],
        index: i,
        offset: i * this.itemHeight,
      });
    }

    return result;
  }

  /**
   * Handle scroll
   */
  onScroll(scrollOffset: number): void {
    this.scrollOffset = scrollOffset;
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  /**
   * Scroll to index
   */
  scrollToIndex(index: number): number {
    const offset = index * this.itemHeight;
    this.onScroll(offset);
    return offset;
  }

  /**
   * Update items
   */
  setItems(items: T[]): void {
    this.items = items;
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  /**
   * Get total height
   */
  getTotalHeight(): number {
    return this.items.length * this.itemHeight;
  }

  /**
   * Subscribe
   */
  subscribe(listener: (state: VirtualListState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

/**
 * Create fixed-size virtual list
 */
export function createFixedSizeVirtualList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan?: number
): FixedSizeVirtualList<T> {
  return new FixedSizeVirtualList<T>(items, itemHeight, containerHeight, overscan);
}

/**
 * Virtual grid for 2D virtualization
 */
export class VirtualGrid<T = unknown> {
  private items: T[][] = [];
  private cellWidth: number;
  private cellHeight: number;
  private containerWidth: number;
  private containerHeight: number;
  private overscan: number;
  private scrollX: number = 0;
  private scrollY: number = 0;

  constructor(
    items: T[][],
    cellWidth: number,
    cellHeight: number,
    containerWidth: number,
    containerHeight: number,
    overscan: number = 2
  ) {
    this.items = items;
    this.cellWidth = cellWidth;
    this.cellHeight = cellHeight;
    this.containerWidth = containerWidth;
    this.containerHeight = containerHeight;
    this.overscan = overscan;
  }

  /**
   * Get visible cells
   */
  getVisibleCells(): Array<{ item: T; row: number; col: number; x: number; y: number }> {
    const rowCount = this.items.length;
    const colCount = this.items[0]?.length ?? 0;

    const visibleCols = Math.ceil(this.containerWidth / this.cellWidth);
    const visibleRows = Math.ceil(this.containerHeight / this.cellHeight);

    const startCol = Math.max(0, Math.floor(this.scrollX / this.cellWidth) - this.overscan);
    const endCol = Math.min(colCount - 1, startCol + visibleCols + this.overscan * 2);
    const startRow = Math.max(0, Math.floor(this.scrollY / this.cellHeight) - this.overscan);
    const endRow = Math.min(rowCount - 1, startRow + visibleRows + this.overscan * 2);

    const result: Array<{ item: T; row: number; col: number; x: number; y: number }> = [];

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        if (this.items[row]?.[col] !== undefined) {
          result.push({
            item: this.items[row][col],
            row,
            col,
            x: col * this.cellWidth,
            y: row * this.cellHeight,
          });
        }
      }
    }

    return result;
  }

  /**
   * Handle scroll
   */
  onScroll(scrollX: number, scrollY: number): void {
    this.scrollX = scrollX;
    this.scrollY = scrollY;
  }

  /**
   * Get total dimensions
   */
  getTotalDimensions(): { width: number; height: number } {
    return {
      width: (this.items[0]?.length ?? 0) * this.cellWidth,
      height: this.items.length * this.cellHeight,
    };
  }
}

/**
 * Create virtual grid
 */
export function createVirtualGrid<T>(
  items: T[][],
  cellWidth: number,
  cellHeight: number,
  containerWidth: number,
  containerHeight: number,
  overscan?: number
): VirtualGrid<T> {
  return new VirtualGrid<T>(
    items,
    cellWidth,
    cellHeight,
    containerWidth,
    containerHeight,
    overscan
  );
}
