# GenomeForge Privacy Architecture

**Document Version:** 1.0.0
**Last Updated:** January 2026

---

## Executive Summary

GenomeForge implements a **zero-knowledge, local-first architecture** where genetic data never leaves the user's device. This document details the technical implementation of our privacy guarantees.

---

## Core Privacy Principles

### 1. Local-Only Data Processing

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         USER'S DEVICE                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                    GenomeForge Application                          │ │
│  │                                                                     │ │
│  │  [Raw Genome File] → [Parser] → [Encrypted Local Storage]          │ │
│  │                           ↓                                         │ │
│  │              [Analysis Engine] ← [Local Database Cache]            │ │
│  │                           ↓                                         │ │
│  │              [Report Generation] → [Local PDF/Markdown]            │ │
│  │                                                                     │ │
│  │  ███████████████████████████████████████████████████████████████████ │
│  │  ██  RAW GENETIC DATA NEVER CROSSES THIS BOUNDARY              ██ │
│  │  ███████████████████████████████████████████████████████████████████ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                            ↓ (Optional, Summarized Only)                 │
│              [Structured Prompts to AI Provider - No Raw SNPs]          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 2. What NEVER Leaves the Device

- Raw genome file content
- Individual SNP data (rsIDs, genotypes, positions)
- Chromosome-level data
- Unprocessed genetic analysis results

### 3. What MAY Leave the Device (With User Consent)

- **AI Conversations**: Summarized findings only
  - ✅ "I have a variant associated with slow caffeine metabolism"
  - ❌ "rs762551 genotype AA on chromosome 15 position 75041917"
- **Optional Cloud Backup**: End-to-end encrypted, user holds keys
- **Crash Reports**: Anonymized, no genetic data

---

## Data Storage Architecture

### Encryption at Rest

All sensitive data is encrypted using **AES-256-GCM** with keys derived via **PBKDF2** (600,000 iterations per OWASP 2023 guidelines).

```typescript
// Key Derivation
const key = await crypto.subtle.deriveKey(
  {
    name: 'PBKDF2',
    hash: 'SHA-256',
    salt: crypto.getRandomValues(new Uint8Array(16)),
    iterations: 600000  // OWASP 2023 recommendation
  },
  masterKeyMaterial,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt']
);

// Encryption
const iv = crypto.getRandomValues(new Uint8Array(12));
const ciphertext = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  key,
  data
);
```

### Storage Locations

| Data Type | Storage | Encryption | Key Source |
|-----------|---------|------------|------------|
| Genome data | IndexedDB (Web) | AES-256-GCM | User password + salt |
| API keys | IndexedDB (Web) / Keychain (iOS) / Keystore (Android) | AES-256-GCM | Device-derived key |
| Settings | LocalStorage | None (non-sensitive) | N/A |
| Reports | IndexedDB (Web) | Optional AES-256-GCM | User password |
| Database cache | IndexedDB (Web) | None (public data) | N/A |

---

## BYOK (Bring Your Own Key) AI Architecture

### How AI Integration Preserves Privacy

```
User asks: "What supplements might help with my methylation status?"

┌─────────────────────────────────────────────────────────────────────┐
│ LOCAL PROCESSING (On Device)                                        │
│                                                                     │
│ 1. Query genome data for methylation genes (MTHFR, MTR, etc.)      │
│ 2. Generate summary: "User has reduced MTHFR activity"             │
│ 3. Build AI prompt with summary (NO raw SNP data)                  │
│                                                                     │
│ Prompt sent to AI:                                                 │
│ "Based on reduced methylation enzyme activity, what supplements    │
│  are commonly recommended? Consider folate forms and cofactors."   │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
                    [User's AI Provider (OpenAI/Anthropic/Ollama)]
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ AI Response (displayed to user)                                     │
│                                                                     │
│ "For reduced methylation activity, consider:                       │
│  - Methylfolate (active B9) instead of folic acid                  │
│  - Methylcobalamin (active B12)..."                                │
└─────────────────────────────────────────────────────────────────────┘
```

### Prompt Sanitization Rules

Before any prompt is sent to an AI provider:

1. **No rsIDs**: Replace `rs1801133` with descriptive text
2. **No Genotypes**: Replace `CT` with "heterozygous" or similar
3. **No Positions**: Never include chromosome positions
4. **Category-Level Only**: "reduced activity" not "67% enzyme efficiency"
5. **No Raw Frequencies**: Use relative terms ("common", "rare")

### Ollama (100% Offline) Option

For maximum privacy, users can use **Ollama** with locally-running models:

- **BioMistral-7B** (Apache 2.0 license) - Recommended
- **Medichat-Llama3-8B** (Meta license)

When using Ollama, **zero data leaves the device** under any circumstances.

---

## Database Privacy

### Public Databases Used

| Database | License | Data Flow |
|----------|---------|-----------|
| ClinVar | Public Domain | Bundled offline copy |
| PharmGKB | CC BY-SA 4.0 | Bundled offline copy |
| GWAS Catalog | CC0 | Optional download |
| gnomAD | ODbL | Population frequencies only |

### No Cloud Database Calls

All database lookups happen locally:

```
[User's rsID] → [Local ClinVar Index] → [Clinical Significance]
                      ↓
                 NO NETWORK REQUEST
```

The only network requests are:
1. Initial database download (one-time)
2. Database updates (weekly/monthly)
3. AI API calls (user-initiated, sanitized)

---

## Platform-Specific Security

### Web Application

- **Content Security Policy (CSP)**:
  ```
  default-src 'self';
  script-src 'self' 'wasm-unsafe-eval';
  connect-src 'self' https://api.openai.com https://api.anthropic.com;
  ```
- **No third-party analytics tracking genome data**
- **HTTPS-only for all external requests**

### iOS Application

- **Keychain Services**: API keys stored in Secure Enclave
- **App Transport Security**: TLS 1.2+ required
- **No iCloud backup of genetic data**

### Android Application

- **Android Keystore**: Hardware-backed key storage
- **Encrypted SharedPreferences**: For sensitive settings
- **No Google Drive backup of genetic data**

---

## Data Lifecycle

### Import

1. User selects local file (never uploaded to server)
2. File parsed in browser/app WebWorker
3. Parsed data encrypted with user password
4. Encrypted data stored in IndexedDB

### Analysis

1. All computation happens locally
2. Database matching uses pre-downloaded indices
3. Risk calculations run client-side

### Export

1. Reports generated as local files
2. PDF/Markdown stored on device
3. Optional: Email to self (user's email provider)

### Deletion

1. User can delete all data at any time
2. Deletion is immediate and complete
3. No server-side copies to delete

---

## Comparison with Competitors

| Aspect | GenomeForge | Competitors |
|--------|-------------|-------------|
| Data location | 100% local | Cloud servers |
| AI processing | BYOK + optional local | Cloud AI only |
| Deletion control | Immediate, complete | Request-based, uncertain |
| Breach risk | None (no central storage) | High (centralized targets) |
| API key storage | User's device only | Provider's servers |

---

## Compliance

### GDPR

- ✅ Data minimization (local-only processing)
- ✅ Right to erasure (immediate local deletion)
- ✅ No cross-border data transfers (local processing)
- ✅ Genetic data (special category) never collected

### HIPAA

- Not a covered entity (no PHI transmission)
- Optional practitioner features would require BAA

### CCPA

- ✅ No sale of personal information
- ✅ Full user control over data
- ✅ Deletion capability

---

## Security Measures

### Key Management

```
Master Password
      ↓
[PBKDF2 - 600K iterations]
      ↓
Master Key (never stored)
      ↓
[HKDF]
      ↓
Data Encryption Key (DEK)
      ↓
[Encrypt] → Stored Genome Data
```

### Recovery Options

1. **Recovery Key**: Generated at setup, user stores offline
2. **Local-Only Mode**: No account, no recovery (maximum privacy)
3. **Multi-Device Sync**: Optional, E2E encrypted

---

## Threat Model

| Threat | Mitigation |
|--------|------------|
| Device theft | Encryption at rest, biometric unlock |
| Malicious file | Strict parsing, sandboxed processing |
| XSS attack | CSP headers, input sanitization |
| MITM on AI calls | TLS-only, certificate validation |
| Memory extraction | Secure wipe on logout, no persistent plaintext |

---

## Audit Trail

For enterprise/practitioner use, optional audit logging (stored locally):

```json
{
  "timestamp": "2026-01-28T10:30:00Z",
  "action": "genome_import",
  "success": true,
  "snpCount": 642000,
  "sensitiveDataSent": false
}
```

**Audit logs never contain genetic data.**

---

## Frequently Asked Questions

### Can GenomeForge be subpoenaed for my genetic data?

No. We don't have your genetic data. It exists only on your device.

### What if I lose my device?

Your data is encrypted. Without your password, it's unreadable. With local-only mode, there's no backup to recover from.

### Does the AI provider see my genetic data?

No. Only summarized findings are sent. The AI never sees rsIDs, genotypes, or raw positions.

### Can I verify this architecture?

Yes. GenomeForge is open-source. Audit the code at github.com/dmhernandez2525/genomeforge

---

*Document maintained by GenomeForge Privacy Team*
*Last security audit: [Pending]*
