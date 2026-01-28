/**
 * Test setup for databases package
 *
 * Sets up fake-indexeddb for Dexie.js testing
 */

import 'fake-indexeddb/auto';
import { beforeEach } from 'vitest';
import { db } from '../db';

// Clear all database tables before each test
beforeEach(async () => {
  await db.clinvar.clear();
  await db.pharmgkb.clear();
  await db.gwas.clear();
  await db.genomes.clear();
  await db.reports.clear();
  await db.conversations.clear();
  await db.settings.clear();
  await db.metadata.clear();
});
