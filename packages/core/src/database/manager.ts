/**
 * Database Manager
 *
 * Manage custom variant annotation databases.
 */

import type {
  CustomDatabase,
  DatabaseRecord,
  DatabaseSchema,
  DatabaseQueryOptions,
  DatabaseQueryResult,
  DatabaseExportOptions,
  DatabaseStats,
  DatabaseEvent,
  DatabaseEventType,
  DatabaseEventListener,
  DatabaseImportOptions,
  DatabaseImportResult,
} from './types';
import { importDatabase, ImportProgressCallback } from './importer';
import { validateSchema } from './schemas';

/**
 * Storage adapter interface for database persistence
 */
export interface DatabaseStorageAdapter {
  /** Get all databases */
  getDatabases(): Promise<CustomDatabase[]>;
  /** Get a database by ID */
  getDatabase(id: string): Promise<CustomDatabase | null>;
  /** Save a database */
  saveDatabase(database: CustomDatabase): Promise<void>;
  /** Delete a database */
  deleteDatabase(id: string): Promise<boolean>;
  /** Get records for a database */
  getRecords(databaseId: string): Promise<DatabaseRecord[]>;
  /** Save records for a database */
  saveRecords(databaseId: string, records: DatabaseRecord[]): Promise<void>;
  /** Delete all records for a database */
  deleteRecords(databaseId: string): Promise<void>;
  /** Query records */
  queryRecords(databaseId: string, options: DatabaseQueryOptions): Promise<DatabaseRecord[]>;
  /** Count records */
  countRecords(databaseId: string): Promise<number>;
}

/**
 * In-memory storage adapter (for development/testing)
 */
export class InMemoryStorageAdapter implements DatabaseStorageAdapter {
  private databases: Map<string, CustomDatabase> = new Map();
  private records: Map<string, DatabaseRecord[]> = new Map();

  async getDatabases(): Promise<CustomDatabase[]> {
    return Array.from(this.databases.values());
  }

  async getDatabase(id: string): Promise<CustomDatabase | null> {
    return this.databases.get(id) || null;
  }

  async saveDatabase(database: CustomDatabase): Promise<void> {
    this.databases.set(database.id, database);
  }

  async deleteDatabase(id: string): Promise<boolean> {
    const existed = this.databases.has(id);
    this.databases.delete(id);
    this.records.delete(id);
    return existed;
  }

  async getRecords(databaseId: string): Promise<DatabaseRecord[]> {
    return this.records.get(databaseId) || [];
  }

  async saveRecords(databaseId: string, records: DatabaseRecord[]): Promise<void> {
    this.records.set(databaseId, records);
  }

  async deleteRecords(databaseId: string): Promise<void> {
    this.records.delete(databaseId);
  }

  async queryRecords(databaseId: string, options: DatabaseQueryOptions): Promise<DatabaseRecord[]> {
    const allRecords = this.records.get(databaseId) || [];
    let results = [...allRecords];

    // Filter
    results = results.filter((record) => {
      const value = record.data[options.field];
      if (value === null || value === undefined) return false;

      const stringValue = String(value).toLowerCase();
      const queryValue = String(options.value).toLowerCase();
      const caseSensitive = options.caseSensitive ?? false;

      switch (options.operator || 'equals') {
        case 'equals':
          return caseSensitive
            ? String(value) === String(options.value)
            : stringValue === queryValue;
        case 'contains':
          return caseSensitive
            ? String(value).includes(String(options.value))
            : stringValue.includes(queryValue);
        case 'startsWith':
          return caseSensitive
            ? String(value).startsWith(String(options.value))
            : stringValue.startsWith(queryValue);
        case 'endsWith':
          return caseSensitive
            ? String(value).endsWith(String(options.value))
            : stringValue.endsWith(queryValue);
        case 'regex':
          const flags = caseSensitive ? '' : 'i';
          return new RegExp(String(options.value), flags).test(String(value));
        case 'gt':
          return Number(value) > Number(options.value);
        case 'lt':
          return Number(value) < Number(options.value);
        case 'gte':
          return Number(value) >= Number(options.value);
        case 'lte':
          return Number(value) <= Number(options.value);
        default:
          return false;
      }
    });

    // Sort
    if (options.sortBy) {
      const sortField = options.sortBy;
      const sortOrder = options.sortOrder || 'asc';
      results.sort((a, b) => {
        const aVal = a.data[sortField];
        const bVal = b.data[sortField];
        if (aVal === null && bVal === null) return 0;
        if (aVal === null) return sortOrder === 'asc' ? 1 : -1;
        if (bVal === null) return sortOrder === 'asc' ? -1 : 1;
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Paginate
    const offset = options.offset || 0;
    const limit = options.limit || results.length;
    return results.slice(offset, offset + limit);
  }

  async countRecords(databaseId: string): Promise<number> {
    return (this.records.get(databaseId) || []).length;
  }
}

/**
 * Database Manager class
 */
export class DatabaseManager {
  private storage: DatabaseStorageAdapter;
  private listeners: Set<DatabaseEventListener> = new Set();
  private cache: Map<string, CustomDatabase> = new Map();
  private cacheValid: boolean = false;

  constructor(storage?: DatabaseStorageAdapter) {
    this.storage = storage || new InMemoryStorageAdapter();
  }

  /**
   * Add an event listener
   */
  addEventListener(listener: DatabaseEventListener): void {
    this.listeners.add(listener);
  }

  /**
   * Remove an event listener
   */
  removeEventListener(listener: DatabaseEventListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Emit an event
   */
  private emit(type: DatabaseEventType, databaseId?: string, data?: Record<string, unknown>): void {
    const event: DatabaseEvent = {
      type,
      databaseId,
      timestamp: new Date().toISOString(),
      data,
    };

    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Database event listener error:', error);
      }
    }
  }

  /**
   * Import a database from content
   */
  async importDatabase(
    content: string,
    options: DatabaseImportOptions & {
      name: string;
      filename?: string;
      onProgress?: ImportProgressCallback;
    }
  ): Promise<DatabaseImportResult> {
    this.emit('import_started', undefined, { name: options.name });

    const progressCallback: ImportProgressCallback = (progress) => {
      this.emit('import_progress', undefined, { progress });
      if (options.onProgress) {
        options.onProgress(progress);
      }
    };

    const result = await importDatabase(content, {
      ...options,
      onProgress: progressCallback,
    });

    if (result.success && result.database) {
      // Check if replacing existing
      if (options.replaceExisting) {
        const existing = await this.getDatabaseByName(options.name);
        if (existing) {
          await this.deleteDatabase(existing.id);
        }
      }

      // Save the database
      await this.storage.saveDatabase(result.database);
      this.cacheValid = false;

      this.emit('import_completed', result.database.id, {
        stats: result.stats,
      });
    } else {
      this.emit('import_failed', undefined, {
        error: result.error,
      });
    }

    return result;
  }

  /**
   * Get all databases
   */
  async getDatabases(): Promise<CustomDatabase[]> {
    if (!this.cacheValid) {
      const databases = await this.storage.getDatabases();
      this.cache.clear();
      for (const db of databases) {
        this.cache.set(db.id, db);
      }
      this.cacheValid = true;
    }
    return Array.from(this.cache.values());
  }

  /**
   * Get enabled databases sorted by priority
   */
  async getEnabledDatabases(): Promise<CustomDatabase[]> {
    const databases = await this.getDatabases();
    return databases
      .filter((db) => db.enabled)
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get a database by ID
   */
  async getDatabase(id: string): Promise<CustomDatabase | null> {
    if (this.cache.has(id)) {
      return this.cache.get(id) || null;
    }
    const db = await this.storage.getDatabase(id);
    if (db) {
      this.cache.set(id, db);
    }
    return db;
  }

  /**
   * Get a database by name
   */
  async getDatabaseByName(name: string): Promise<CustomDatabase | null> {
    const databases = await this.getDatabases();
    return databases.find((db) => db.name === name) || null;
  }

  /**
   * Create a new empty database
   */
  async createDatabase(options: {
    name: string;
    description?: string;
    schema: DatabaseSchema;
    source?: CustomDatabase['source'];
    priority?: number;
    tags?: string[];
  }): Promise<CustomDatabase> {
    // Validate schema
    const schemaValidation = validateSchema(options.schema);
    if (!schemaValidation.valid) {
      throw new Error(`Invalid schema: ${schemaValidation.errors.join(', ')}`);
    }

    const database: CustomDatabase = {
      id: `db_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      name: options.name,
      description: options.description,
      version: '1.0.0',
      schema: options.schema,
      source: options.source,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      recordCount: 0,
      fileSize: 0,
      enabled: true,
      priority: options.priority ?? 0,
      tags: options.tags,
    };

    await this.storage.saveDatabase(database);
    this.cache.set(database.id, database);
    this.emit('database_created', database.id);

    return database;
  }

  /**
   * Update a database
   */
  async updateDatabase(
    id: string,
    updates: Partial<Pick<CustomDatabase, 'name' | 'description' | 'enabled' | 'priority' | 'tags' | 'source'>>
  ): Promise<CustomDatabase | null> {
    const database = await this.getDatabase(id);
    if (!database) return null;

    const updated: CustomDatabase = {
      ...database,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.storage.saveDatabase(updated);
    this.cache.set(id, updated);

    if (updates.enabled !== undefined) {
      this.emit(updates.enabled ? 'database_enabled' : 'database_disabled', id);
    } else {
      this.emit('database_updated', id);
    }

    return updated;
  }

  /**
   * Delete a database
   */
  async deleteDatabase(id: string): Promise<boolean> {
    const deleted = await this.storage.deleteDatabase(id);
    if (deleted) {
      this.cache.delete(id);
      this.emit('database_deleted', id);
    }
    return deleted;
  }

  /**
   * Enable a database
   */
  async enableDatabase(id: string): Promise<boolean> {
    const result = await this.updateDatabase(id, { enabled: true });
    return result !== null;
  }

  /**
   * Disable a database
   */
  async disableDatabase(id: string): Promise<boolean> {
    const result = await this.updateDatabase(id, { enabled: false });
    return result !== null;
  }

  /**
   * Set database priority
   */
  async setDatabasePriority(id: string, priority: number): Promise<boolean> {
    const result = await this.updateDatabase(id, { priority });
    return result !== null;
  }

  /**
   * Add records to a database
   */
  async addRecords(
    databaseId: string,
    records: Record<string, string | number | boolean | null>[]
  ): Promise<number> {
    const database = await this.getDatabase(databaseId);
    if (!database) {
      throw new Error(`Database not found: ${databaseId}`);
    }

    const existingRecords = await this.storage.getRecords(databaseId);
    const timestamp = new Date().toISOString();

    const newRecords: DatabaseRecord[] = records.map((data, index) => ({
      id: `rec_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 8)}`,
      databaseId,
      data,
      createdAt: timestamp,
    }));

    await this.storage.saveRecords(databaseId, [...existingRecords, ...newRecords]);

    // Update record count
    const newCount = existingRecords.length + newRecords.length;
    await this.updateDatabase(databaseId, {});
    database.recordCount = newCount;
    this.cache.set(databaseId, database);

    return newRecords.length;
  }

  /**
   * Query records from a database
   */
  async queryRecords(databaseId: string, options: DatabaseQueryOptions): Promise<DatabaseQueryResult> {
    const startTime = Date.now();
    const database = await this.getDatabase(databaseId);
    if (!database) {
      return {
        records: [],
        totalCount: 0,
        executionTime: Date.now() - startTime,
      };
    }

    const records = await this.storage.queryRecords(databaseId, options);
    const totalCount = await this.storage.countRecords(databaseId);

    this.emit('query_executed', databaseId, {
      field: options.field,
      value: options.value,
      resultCount: records.length,
    });

    return {
      records,
      totalCount,
      executionTime: Date.now() - startTime,
    };
  }

  /**
   * Query records by rsid across all enabled databases
   */
  async queryByRsid(rsid: string): Promise<Map<string, DatabaseRecord[]>> {
    const results = new Map<string, DatabaseRecord[]>();
    const databases = await this.getEnabledDatabases();

    for (const database of databases) {
      // Find rsid field in schema
      const rsidField = database.schema.fields.find((f) => f.type === 'rsid');
      if (!rsidField) continue;

      const queryResult = await this.queryRecords(database.id, {
        field: rsidField.name,
        value: rsid.toLowerCase(),
        operator: 'equals',
        caseSensitive: false,
      });

      if (queryResult.records.length > 0) {
        results.set(database.id, queryResult.records);
      }
    }

    return results;
  }

  /**
   * Export a database
   */
  async exportDatabase(databaseId: string, options: DatabaseExportOptions): Promise<string> {
    const database = await this.getDatabase(databaseId);
    if (!database) {
      throw new Error(`Database not found: ${databaseId}`);
    }

    const records = await this.storage.getRecords(databaseId);
    const fields = options.fields || database.schema.fields.map((f) => f.name);

    switch (options.format) {
      case 'json':
        const data = records.map((r) => {
          const obj: Record<string, unknown> = {};
          for (const field of fields) {
            obj[field] = r.data[field];
          }
          return obj;
        });
        return options.prettyPrint
          ? JSON.stringify(data, null, 2)
          : JSON.stringify(data);

      case 'csv':
      case 'tsv':
        const delimiter = options.format === 'tsv' ? '\t' : (options.delimiter || ',');
        const lines: string[] = [];

        if (options.includeHeader !== false) {
          lines.push(fields.join(delimiter));
        }

        for (const record of records) {
          const values = fields.map((field) => {
            const value = record.data[field];
            if (value === null || value === undefined) return '';
            const str = String(value);
            // Quote if contains delimiter or quotes
            if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          });
          lines.push(values.join(delimiter));
        }

        return lines.join('\n');

      case 'vcf':
        throw new Error('VCF export not yet implemented');

      default:
        throw new Error(`Unknown export format: ${options.format}`);
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<DatabaseStats> {
    const databases = await this.getDatabases();

    const byType: Record<string, number> = {};
    const byTag: Record<string, number> = {};
    let totalRecords = 0;
    let totalSize = 0;

    for (const db of databases) {
      totalRecords += db.recordCount;
      totalSize += db.fileSize;

      // Count by schema type
      const schemaType = db.schema.id;
      byType[schemaType] = (byType[schemaType] || 0) + 1;

      // Count by tags
      if (db.tags) {
        for (const tag of db.tags) {
          byTag[tag] = (byTag[tag] || 0) + 1;
        }
      }
    }

    return {
      totalDatabases: databases.length,
      totalRecords,
      totalSize,
      byType,
      byTag,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheValid = false;
  }
}

/**
 * Create a singleton database manager instance
 */
let defaultDatabaseManager: DatabaseManager | null = null;

export function getDatabaseManager(): DatabaseManager {
  if (!defaultDatabaseManager) {
    defaultDatabaseManager = new DatabaseManager();
  }
  return defaultDatabaseManager;
}

export function setDatabaseManager(manager: DatabaseManager): void {
  defaultDatabaseManager = manager;
}
