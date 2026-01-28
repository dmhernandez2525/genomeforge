# GenomeForge Architecture Patterns

**Version:** 1.0.0
**Last Updated:** 2026-01-28

---

## Core Principles

### 1. Privacy by Architecture
Genetic data never leaves the user's device. This isn't a policy - it's enforced by architecture.

```
✅ Allowed data flows:
- Raw genome → Browser/App → Local IndexedDB
- Summaries → AI API (with user's own keys)
- Database bundles → CDN → User device

❌ Prohibited data flows:
- Raw genome → Any external server
- rsIDs → Our servers
- API keys → Our servers
```

### 2. Offline-First
Core functionality works without internet:
- Genome parsing
- Database matching
- Report generation
- Ollama AI (local)

### 3. Platform Abstraction
Shared TypeScript packages work across all platforms:
- `@genomeforge/core` - Parser, matcher, analyzer
- `@genomeforge/types` - Shared type definitions
- `@genomeforge/ai-providers` - AI abstraction

---

## Package Architecture

### Dependency Graph

```
@genomeforge/types (base - no dependencies)
       ↑
@genomeforge/encryption ────────────────────┐
       ↑                                    │
@genomeforge/core                           │
       ↑                                    │
@genomeforge/databases                      │
       ↑                                    │
@genomeforge/ai-providers ←─────────────────┤
       ↑                                    │
@genomeforge/reports                        │
       ↑                                    │
@genomeforge/ui ←───────────────────────────┘
       ↑
   apps/*
```

### Package Responsibilities

| Package | Responsibility | Platform |
|---------|----------------|----------|
| `types` | TypeScript definitions only | All |
| `core` | Parser, matcher, analyzer | All |
| `databases` | ClinVar, PharmGKB loaders | All |
| `ai-providers` | OpenAI, Anthropic, Ollama | All |
| `encryption` | AES-256-GCM, key derivation | All |
| `reports` | PDF generation | Web, Desktop |
| `ui` | Shared React components | Web, Desktop |

---

## State Management

### Zustand Store Pattern

```typescript
// Separate stores by domain
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Genome store - NOT persisted (too large)
export const useGenomeStore = create<GenomeState>((set) => ({
  genome: null,
  isLoading: false,
  error: null,
  setGenome: (genome) => set({ genome }),
  clear: () => set({ genome: null })
}));

// Settings store - persisted to IndexedDB
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      aiProvider: 'openai',
      setTheme: (theme) => set({ theme })
    }),
    {
      name: 'genomeforge-settings',
      storage: createJSONStorage(() => indexedDBStorage)
    }
  )
);
```

### Data Flow

```
User Action → Zustand Action → Update Store → React Re-render
                    ↓
              Side Effects (via middleware)
                    ↓
              IndexedDB (if persisted)
```

---

## Database Architecture

### IndexedDB Schema (Web)

```typescript
// Using Dexie for IndexedDB
class GenomeForgeDB extends Dexie {
  clinvar!: Table<ClinVarVariant, string>;     // Key: rsid
  pharmgkb!: Table<PharmGKBVariant, string>;   // Key: rsid
  gnomad!: Table<GnomADFrequency, string>;     // Key: rsid
  genomes!: Table<ParsedGenome, string>;       // Key: id
  reports!: Table<Report, string>;             // Key: id
  conversations!: Table<Conversation, string>; // Key: id
  settings!: Table<Setting, string>;           // Key: key
  metadata!: Table<DatabaseMetadata, string>;  // Key: database

  constructor() {
    super('GenomeForgeDB');
    this.version(1).stores({
      clinvar: 'rsid, gene, clinicalSignificance',
      pharmgkb: 'rsid, gene',
      gnomad: 'rsid',
      genomes: 'id, fileName, parsedAt',
      reports: 'id, genomeId, type, generatedAt',
      conversations: 'id, genomeId, lastMessageAt',
      settings: 'key',
      metadata: 'database'
    });
  }
}
```

### SQLite Schema (Mobile/Desktop)

```sql
-- Same structure, different implementation
CREATE TABLE clinvar (
  rsid TEXT PRIMARY KEY,
  gene TEXT,
  clinical_significance TEXT,
  review_status INTEGER,
  data JSON
);

CREATE INDEX idx_clinvar_gene ON clinvar(gene);
CREATE INDEX idx_clinvar_significance ON clinvar(clinical_significance);
```

---

## AI Integration Patterns

### Provider Factory

```typescript
// Factory pattern for provider creation
export class AIProviderFactory {
  static create(config: AIConfig): IAIProvider {
    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider(config.apiKey!, config.baseUrl);
      case 'anthropic':
        return new AnthropicProvider(config.apiKey!, config.baseUrl);
      case 'google':
        return new GoogleProvider(config.apiKey!, config.baseUrl);
      case 'ollama':
        return new OllamaProvider(config.baseUrl);
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }
  }
}
```

### Context Building (Privacy-Safe)

```typescript
// CRITICAL: Never include raw genome data in AI context
export function buildGeneticContext(matchResult: MatchResult): GeneticContext {
  return {
    // Only summaries - no rsIDs, no genotypes
    pathogenicVariants: matchResult.annotatedSNPs
      .filter(s => s.category === 'pathogenic')
      .slice(0, 20)
      .map(s => ({
        gene: s.clinvar?.gene ?? 'Unknown',
        condition: s.clinvar?.conditions[0]?.name ?? 'Unknown',
        significance: s.clinvar?.clinicalSignificance ?? 'unknown',
        stars: s.clinvar?.reviewStatus ?? 0
        // NO rsid, NO genotype
      })),

    reportSummary: `Analysis of ${matchResult.totalSNPs.toLocaleString()} variants...`
  };
}
```

---

## Encryption Patterns

### Key Derivation

```typescript
// PBKDF2 with high iteration count for GPU resistance
const ITERATIONS = 600000;  // OWASP 2023 recommendation

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}
```

### Encryption/Decryption

```typescript
// AES-256-GCM for authenticated encryption
async function encrypt(data: string, key: CryptoKey): Promise<EncryptedData> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(data)
  );

  return {
    iv: base64Encode(iv),
    ciphertext: base64Encode(new Uint8Array(ciphertext)),
    salt: '' // Salt stored separately during key derivation
  };
}
```

---

## Memory Management

### Chunked Processing for Mobile

```typescript
// Safari iOS: ~256MB limit
// Chrome Android: ~300MB limit
const MAX_MEMORY_MB = 200;
const CHUNK_SIZE = 50000;

async function* parseChunked(file: File): AsyncGenerator<SNP[]> {
  const reader = file.stream().getReader();
  let buffer: SNP[] = [];

  // Stream and yield chunks
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const snps = parseBytes(value);
    buffer.push(...snps);

    if (buffer.length >= CHUNK_SIZE) {
      yield buffer;
      buffer = [];

      // Allow GC
      await new Promise(r => setTimeout(r, 0));
    }
  }

  if (buffer.length > 0) {
    yield buffer;
  }
}
```

### Memory Monitoring

```typescript
function checkMemoryPressure(): boolean {
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory;
    const usedMB = memory.usedJSHeapSize / (1024 * 1024);
    return usedMB > MAX_MEMORY_MB;
  }
  return false;
}
```

---

## Error Handling

### Custom Error Classes

```typescript
// Domain-specific errors
export class GenomeForgeError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'GenomeForgeError';
    this.code = code;
  }
}

export class GenomeParseError extends GenomeForgeError {
  line?: number;

  constructor(code: string, message: string, line?: number) {
    super(code, message);
    this.name = 'GenomeParseError';
    this.line = line;
  }
}

export class AIProviderError extends GenomeForgeError {
  provider: AIProvider;

  constructor(provider: AIProvider, code: string, message: string) {
    super(code, message);
    this.name = 'AIProviderError';
    this.provider = provider;
  }
}
```

### Error Boundary Pattern

```typescript
// React error boundary for graceful degradation
function ErrorBoundary({ children, fallback }: Props) {
  const [error, setError] = useState<Error | null>(null);

  if (error) {
    return <ErrorFallback error={error} reset={() => setError(null)} />;
  }

  return (
    <ErrorBoundaryContext.Provider value={{ setError }}>
      {children}
    </ErrorBoundaryContext.Provider>
  );
}
```

---

## Testing Patterns

### Unit Test Structure

```typescript
// Vitest with clear describe/it blocks
describe('GenomeParser', () => {
  describe('detectFormat', () => {
    it('detects 23andMe v5 format', () => {
      const header = '# rsid\tchromosome\tposition\tgenotype';
      expect(detectFormat(header)).toBe('23andme_v5');
    });

    it('returns unknown for unrecognized format', () => {
      const header = 'random,csv,data';
      expect(detectFormat(header)).toBe('unknown');
    });
  });

  describe('parseGenomeFile', () => {
    it('parses valid 23andMe file', async () => {
      const file = new File([MOCK_23ANDME_DATA], 'test.txt');
      const result = await parseGenomeFile(file);

      expect(result.format).toBe('23andme_v5');
      expect(result.snpCount).toBeGreaterThan(0);
      expect(result.validation.valid).toBe(true);
    });
  });
});
```

### Integration Test Structure

```typescript
describe('Full Analysis Pipeline', () => {
  it('processes genome and generates report', async () => {
    // 1. Parse
    const genome = await parseGenomeFile(testFile);

    // 2. Match
    const matches = await matchGenome(genome, mockDatabase);

    // 3. Analyze
    const analysis = analyzeGenome(matches);

    // 4. Generate report
    const report = await generateReport(matches, { type: 'disease_risk' });

    expect(report.sections.length).toBeGreaterThan(0);
  });
});
```

---

## Performance Targets

| Operation | Target | Platform |
|-----------|--------|----------|
| Format detection | <100ms | All |
| Parse 700K SNPs | <15s | Desktop |
| Parse 700K SNPs | <30s | Mobile |
| Database lookup (batch) | <500ms | All |
| Report generation | <5s | All |
| AI response (streaming) | First token <2s | All |

---

**Document Version:** 1.0.0
**Author:** GenomeForge Team
