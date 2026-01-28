# GenomeForge Feature Backlog

**Version:** 1.0.0
**Created:** 2026-01-28
**Total Features:** 127

---

## Feature Priority Legend

| Priority | Label | Description |
|----------|-------|-------------|
| **P0** | Must Have | Required for MVP launch |
| **P1** | Should Have | High value, post-MVP |
| **P2** | Nice to Have | Future consideration |
| **P3** | Deferred | Low priority or blocked |

## Status Legend

| Status | Description |
|--------|-------------|
| `planned` | Scheduled for implementation |
| `in-progress` | Currently being developed |
| `completed` | Implemented and tested |
| `blocked` | Waiting on dependency |
| `deferred` | Moved to future phase |

---

## Phase 1: Core Foundation (MVP)

### Data Import & Processing

| ID | Feature | Priority | Status | Effort | Notes |
|----|---------|----------|--------|--------|-------|
| F001 | 23andMe v5 parser (TSV, ~630K SNPs) | P0 | planned | M | Build 37 reference |
| F002 | AncestryDNA parser (CSV, ~700K SNPs) | P0 | planned | M | 5-column format, 44% SNP overlap with 23andMe |
| F003 | MyHeritage parser (CSV) | P0 | planned | S | Similar to AncestryDNA |
| F004 | FTDNA parser (CSV) | P0 | planned | S | Standard CSV |
| F005 | LivingDNA parser (CSV) | P0 | planned | S | 14% overlap with 23andMe - test carefully |
| F006 | VCF parser (WGS/WES data) | P0 | planned | L | Support VCF 4.2+ |
| F007 | Automatic format detection | P0 | planned | M | Header pattern matching |
| F008 | Genome build detection (36/37/38) | P0 | planned | M | 100 random rsID position matching |
| F009 | File validation with error reporting | P0 | planned | M | Malformed headers, invalid genotypes |
| F010 | SNP count and coverage statistics | P0 | planned | S | Display after upload |
| F011 | Cross-test merging with discrepancy highlighting | P1 | planned | L | For users with multiple tests |
| F012 | BAM import for WGS customers | P2 | deferred | XL | Low priority, complex |
| F013 | Chip cluster quality control filtering | P1 | planned | M | From snps library patterns |

### Database Integration

| ID | Feature | Priority | Status | Effort | Notes |
|----|---------|----------|--------|--------|-------|
| F014 | ClinVar database loader (~173MB compressed) | P0 | planned | L | Public domain, weekly updates |
| F015 | ClinVar pathogenicity lookup with star ratings | P0 | planned | M | 5-tier classification |
| F016 | PharmGKB database loader (~50MB) | P0 | planned | M | CC BY-SA 4.0, SaaS permitted |
| F017 | PharmGKB drug-gene interaction matching | P0 | planned | M | Evidence levels 1A-4 |
| F018 | gnomAD population frequency lookup | P0 | planned | L | 9 populations, ODbL license |
| F019 | GWAS Catalog integration (~500MB) | P2 | planned | L | Desktop only, Phase 3 |
| F020 | Database version tracking | P0 | planned | S | For update management |
| F021 | Delta update mechanism for ClinVar | P1 | planned | M | Weekly deltas vs full download |
| F022 | IndexedDB storage for offline access | P0 | planned | M | Web platform |
| F023 | SQLite storage for mobile/desktop | P1 | planned | M | Phase 2-3 |

### Variant Annotation

| ID | Feature | Priority | Status | Effort | Notes |
|----|---------|----------|--------|--------|-------|
| F024 | Effect prediction (missense, nonsense, frameshift) | P0 | planned | M | HIGH/MODERATE/LOW/MODIFIER |
| F025 | Impact magnitude scoring (0-6 scale) | P0 | planned | M | Based on Promethease methodology |
| F026 | Carrier status detection | P0 | planned | M | Recessive condition identification |
| F027 | Protective variant identification | P0 | planned | S | Good genotypes |
| F028 | Variant normalization and left-alignment | P0 | planned | M | ClinVar tools reference |
| F029 | ACMG classification display | P1 | planned | M | Standard classification |
| F030 | Protein domain visualization | P2 | deferred | L | Complex visualization |
| F031 | HGVS expression display | P1 | planned | S | Standard nomenclature |

### Pharmacogenomics

| ID | Feature | Priority | Status | Effort | Notes |
|----|---------|----------|--------|--------|-------|
| F032 | Star allele calling (CYP2D6, CYP2C19, etc.) | P0 | planned | L | PharmCAT methodology |
| F033 | Metabolizer phenotype prediction | P0 | planned | M | Poor/Intermediate/Normal/Rapid/Ultra |
| F034 | CPIC dosing guideline integration | P0 | planned | M | 165 guidelines available |
| F035 | Drug interaction warnings | P0 | planned | M | Color-coded severity |
| F036 | Activity score calculation | P0 | planned | M | CPIC standard methodology |
| F037 | FDA drug label annotations | P0 | planned | M | Regulatory information |
| F038 | DPWG guideline support | P1 | planned | M | European guidelines |
| F039 | Medication list cross-reference | P2 | planned | M | User enters current medications |

### Report Generation

| ID | Feature | Priority | Status | Effort | Notes |
|----|---------|----------|--------|--------|-------|
| F040 | Exhaustive Genetic Report template | P0 | planned | L | Drug metabolism, methylation, nutrition |
| F041 | Disease Risk Report template | P0 | planned | L | Pathogenic variants, carrier status |
| F042 | Actionable Health Protocol template | P0 | planned | L | No supplement upselling |
| F043 | Pharmacogenomics Report template | P0 | planned | L | Drug sensitivities |
| F044 | PDF export using @react-pdf/renderer | P0 | planned | M | 16K+ stars, declarative JSX |
| F045 | Color-coded severity (red/yellow/green) | P0 | planned | S | Proven UX pattern |
| F046 | Medical disclaimers on all reports | P0 | planned | S | Regulatory requirement |
| F047 | Executive summary generation | P0 | planned | M | Plain-English overview |
| F048 | Literature citations per finding | P0 | planned | M | Link to studies |
| F049 | Report sharing via encrypted link | P1 | planned | M | Zero-knowledge encryption |

### BYOK AI Integration

| ID | Feature | Priority | Status | Effort | Notes |
|----|---------|----------|--------|--------|-------|
| F050 | Unified AI provider interface | P0 | planned | M | Abstraction layer |
| F051 | OpenAI GPT-4/GPT-4o integration | P0 | planned | M | Most popular provider |
| F052 | Anthropic Claude 3.5/Opus integration | P0 | planned | M | Strong reasoning |
| F053 | Google Gemini integration | P0 | planned | M | Alternative option |
| F054 | Streaming response support | P0 | planned | M | Real-time responses |
| F055 | Error handling and fallbacks | P0 | planned | M | Graceful degradation |
| F056 | Conversational chat interface | P0 | planned | L | "Chat with your genome" |
| F057 | Structured prompts (no raw genome) | P0 | planned | M | Privacy protection |
| F058 | Conversation history (local only) | P0 | planned | S | IndexedDB storage |
| F059 | "I don't know" uncertainty handling | P0 | planned | S | K Health pattern |
| F060 | Confidence level display | P0 | planned | S | Transparency |

### Security & Encryption

| ID | Feature | Priority | Status | Effort | Notes |
|----|---------|----------|--------|--------|-------|
| F061 | AES-256-GCM encryption for API keys | P0 | planned | M | Industry standard |
| F062 | PBKDF2-SHA256 key derivation (600K iterations) | P0 | planned | M | GPU resistance |
| F063 | Web Crypto API implementation | P0 | planned | M | Browser-native |
| F064 | Secure IndexedDB storage | P0 | planned | M | Encrypted at rest |
| F065 | Key never transmitted to servers | P0 | planned | S | Architecture guarantee |
| F066 | Zero-knowledge sync capability | P1 | planned | L | For future family sharing |
| F067 | Recovery key generation | P1 | planned | M | User stores offline |
| F068 | Hardware key support (YubiKey) | P2 | deferred | M | Power users |

### Web Application

| ID | Feature | Priority | Status | Effort | Notes |
|----|---------|----------|--------|--------|-------|
| F069 | React 19 + Vite setup | P0 | planned | S | Latest stable |
| F070 | Tailwind CSS 4 + shadcn/ui | P0 | planned | S | Modern styling |
| F071 | Zustand state management | P0 | planned | S | Lightweight |
| F072 | TanStack Query for data fetching | P0 | planned | S | Caching, offline |
| F073 | React Router 7 routing | P0 | planned | S | File-based routes |
| F074 | Upload page with drag-drop | P0 | planned | M | Primary entry point |
| F075 | Analysis dashboard | P0 | planned | L | Overview of findings |
| F076 | Report viewer components | P0 | planned | L | Interactive reports |
| F077 | Chat interface | P0 | planned | M | AI conversation |
| F078 | Settings page for API keys | P0 | planned | M | Key management |
| F079 | Responsive design | P0 | planned | M | Mobile-friendly web |
| F080 | Dark mode support | P0 | planned | S | User preference |
| F081 | Accessibility (WCAG 2.1 AA) | P0 | planned | M | Required |
| F082 | Service Worker for offline | P1 | planned | M | PWA capability |

### Marketing Site

| ID | Feature | Priority | Status | Effort | Notes |
|----|---------|----------|--------|--------|-------|
| F083 | Next.js 16 static site | P0 | planned | M | Marketing presence |
| F084 | Home page (privacy-first messaging) | P0 | planned | M | Hero, value prop |
| F085 | Features page | P0 | planned | M | All capabilities |
| F086 | Pricing page | P0 | planned | M | $29 BYOK, $49 Pro |
| F087 | Documentation | P0 | planned | L | User guides |
| F088 | Download page | P0 | planned | S | Phase 2-3 apps |
| F089 | About page (privacy architecture) | P0 | planned | M | Trust building |
| F090 | Render deployment | P0 | planned | S | CI/CD configured |

---

## Phase 2: Mobile Expansion

### iOS Application

| ID | Feature | Priority | Status | Effort | Notes |
|----|---------|----------|--------|--------|-------|
| F091 | Expo SDK 52+ with New Architecture | P1 | planned | M | Foundation |
| F092 | Expo Router v4 navigation | P1 | planned | M | File-based |
| F093 | NativeWind 4 styling | P1 | planned | S | Tailwind for RN |
| F094 | expo-sqlite local database | P1 | planned | M | SQLite storage |
| F095 | expo-crypto encryption | P1 | planned | M | Native crypto |
| F096 | expo-secure-store for API keys | P1 | planned | M | Keychain access |
| F097 | Apple HealthKit integration | P1 | planned | M | Health data |
| F098 | Face ID/Touch ID | P1 | planned | S | Biometric auth |
| F099 | Share extension for import | P1 | planned | M | Easy file import |
| F100 | Chunked parsing (<256MB) | P0 | planned | L | Safari iOS limit |
| F101 | TestFlight distribution | P1 | planned | S | Beta testing |

### Android Application

| ID | Feature | Priority | Status | Effort | Notes |
|----|---------|----------|--------|--------|-------|
| F102 | Android Keystore integration | P1 | planned | M | Secure storage |
| F103 | Biometric authentication | P1 | planned | S | Fingerprint/face |
| F104 | Intent handling for import | P1 | planned | M | File sharing |
| F105 | Material Design 3 components | P1 | planned | M | Native feel |
| F106 | Google Play Store preparation | P1 | planned | M | Store listing |
| F107 | Memory optimization (<300MB) | P0 | planned | L | Chrome Android limit |

### Offline AI (Ollama)

| ID | Feature | Priority | Status | Effort | Notes |
|----|---------|----------|--------|--------|-------|
| F108 | Ollama API client | P1 | planned | M | Local AI |
| F109 | BioMistral-7B support | P1 | planned | M | Apache 2.0, recommended |
| F110 | Model download management | P1 | planned | M | User-initiated |
| F111 | Offline mode detection | P1 | planned | S | Auto-fallback |
| F112 | Streaming local inference | P1 | planned | M | Real-time output |

---

## Phase 3: Desktop Native

### macOS Application

| ID | Feature | Priority | Status | Effort | Notes |
|----|---------|----------|--------|--------|-------|
| F113 | Swift 5 + AppKit foundation | P2 | planned | L | Native macOS |
| F114 | Menu bar quick access | P2 | planned | M | Quick access |
| F115 | Full window application | P2 | planned | L | Complete UI |
| F116 | SQLite.swift database | P2 | planned | M | Local storage |
| F117 | CommonCrypto encryption | P2 | planned | M | Native crypto |
| F118 | Ollama native integration | P2 | planned | M | Desktop AI |
| F119 | Notarization for distribution | P2 | planned | M | App Store/direct |
| F120 | Sparkle auto-updates | P2 | planned | M | Update mechanism |
| F121 | Touch Bar support | P2 | planned | S | MacBook Pro |
| F122 | Spotlight integration | P2 | planned | S | System search |

### Windows Application

| ID | Feature | Priority | Status | Effort | Notes |
|----|---------|----------|--------|--------|-------|
| F123 | Tauri 2.0 + React frontend | P2 | planned | L | Lightweight |
| F124 | Rust backend operations | P2 | planned | M | Native perf |
| F125 | Windows installer (MSI/NSIS) | P2 | planned | M | Distribution |
| F126 | Windows Hello integration | P2 | planned | M | Biometric |
| F127 | MSIX packaging | P2 | planned | M | Modern packaging |
| F128 | Auto-updater | P2 | planned | M | Tauri built-in |
| F129 | System tray integration | P2 | planned | S | Background access |
| F130 | Code signing | P2 | planned | M | SmartScreen |

### Extended Databases

| ID | Feature | Priority | Status | Effort | Notes |
|----|---------|----------|--------|--------|-------|
| F131 | GWAS Catalog full integration | P2 | planned | L | 625K+ associations |
| F132 | PGS Catalog integration | P2 | planned | L | Pre-computed PRS weights |
| F133 | gnomAD v4.1 integration | P2 | planned | M | 807K individuals |

---

## Phase 4: Advanced Features

### Family Genetics

| ID | Feature | Priority | Status | Effort | Notes |
|----|---------|----------|--------|--------|-------|
| F134 | Multi-profile management | P2 | planned | M | Family members |
| F135 | Shared DNA calculation (cM) | P2 | planned | L | lineage library |
| F136 | Relationship prediction | P2 | planned | M | Parent/sibling/cousin |
| F137 | Carrier risk for couples | P2 | planned | M | Pre-conception |
| F138 | Inheritance visualization | P2 | planned | M | Pedigree charts |
| F139 | Signal Protocol key exchange | P2 | planned | L | Secure sharing |
| F140 | Encrypted family sharing | P2 | planned | L | Zero-knowledge |
| F141 | Time-delayed emergency access | P2 | planned | M | Trusted contacts |

### Polygenic Risk Scores

| ID | Feature | Priority | Status | Effort | Notes |
|----|---------|----------|--------|--------|-------|
| F142 | Simple P+T scoring (client-side) | P2 | planned | L | Pre-computed weights |
| F143 | Ancestry adjustment (PC regression) | P2 | planned | M | gnomAD populations |
| F144 | Confidence interval display | P2 | planned | M | Percentile ranges |
| F145 | Pictograph visualization | P2 | planned | M | 100 figures pattern |
| F146 | Population distribution curves | P2 | planned | M | Context for scores |
| F147 | PRS for CAD (PGS000018) | P2 | planned | M | UK Biobank validated |
| F148 | PRS for Type 2 Diabetes | P2 | planned | M | Multi-ancestry |
| F149 | PRS for Breast Cancer | P2 | planned | M | Mavaddat et al. 2019 |

### Practitioner Portal (B2B)

| ID | Feature | Priority | Status | Effort | Notes |
|----|---------|----------|--------|--------|-------|
| F150 | HIPAA compliance | P2 | planned | XL | Required for B2B |
| F151 | Practitioner dashboard | P2 | planned | L | Patient management |
| F152 | Patient management | P2 | planned | M | CRUD operations |
| F153 | Shareable report links | P2 | planned | M | Encrypted sharing |
| F154 | Audit logging | P2 | planned | M | Compliance |
| F155 | REST API for integrations | P2 | planned | L | External systems |
| F156 | Webhook support | P2 | planned | M | Event notifications |
| F157 | API key management | P2 | planned | M | Developer access |
| F158 | OpenAPI documentation | P2 | planned | M | Developer docs |

### Visualization & UX

| ID | Feature | Priority | Status | Effort | Notes |
|----|---------|----------|--------|--------|-------|
| F159 | IGV.js genome browser | P1 | planned | M | Broad Institute |
| F160 | Ideogram.js chromosome views | P1 | planned | M | SNP location |
| F161 | Pathway-based visualization | P1 | planned | L | StrateGene approach |
| F162 | Manhattan plots (Plotly.js) | P2 | planned | M | GWAS results |
| F163 | Population frequency charts | P2 | planned | M | gnomAD context |

### Accessibility & i18n

| ID | Feature | Priority | Status | Effort | Notes |
|----|---------|----------|--------|--------|-------|
| F164 | Screen reader support | P0 | planned | M | WCAG required |
| F165 | Keyboard navigation | P0 | planned | M | Full access |
| F166 | Color-blind safe palette | P0 | planned | S | Icons + text labels |
| F167 | High contrast mode | P1 | planned | S | Clinical environments |
| F168 | Spanish translation | P2 | planned | L | High genetic testing adoption |
| F169 | German translation | P2 | planned | L | EU market, GDPR focus |
| F170 | 24-hour report delivery | P1 | planned | M | Xcode Life pattern |

### Advanced Features

| ID | Feature | Priority | Status | Effort | Notes |
|----|---------|----------|--------|--------|-------|
| F171 | Voice input for AI chat | P2 | planned | M | Accessibility |
| F172 | Text-to-speech for reports | P2 | planned | M | Accessibility |
| F173 | AISNP panel ancestry (ezancestry) | P2 | planned | M | Ready library |
| F174 | Haplogroup prediction | P2 | planned | M | mtDNA, Y-DNA |
| F175 | Historical ancestry components | P2 | planned | M | Viking, Celtic |
| F176 | Chromosome painting | P2 | planned | L | Visual ancestry |
| F177 | Weekly trait updates | P3 | deferred | M | Genomelink model |

---

## Explicitly Excluded Features

| Feature | Reason | Alternative |
|---------|--------|-------------|
| SNPedia integration | MyHeritage exclusive license | ClinVar + PharmGKB + GWAS |
| Full imputation (200M variants) | Requires 100GB+ reference, server-side | Pre-computed PRS weights |
| Diagnostic claims | FDA 510(k) required ($3.1M, 31 months) | Wellness positioning |
| Genetic counselor interpretation | 36 states require licensure | Disclaimer + referral |
| Supplement sales | Trust erosion per user research | No upselling, transparent pricing |
| Server-side genetic storage | Privacy is core differentiator | 100% local processing |

---

## Feature Dependencies

```
F001-F006 (Parsers) → F007 (Auto-detect) → F008 (Build detect) → F014-F018 (Database matching)
F014-F018 (Databases) → F024-F031 (Annotation) → F040-F044 (Reports)
F050-F060 (BYOK AI) → F056 (Chat interface)
F061-F065 (Encryption) → F050-F060 (AI keys secure)
F091-F107 (Mobile) → F108-F112 (Ollama mobile)
F113-F130 (Desktop) → F131-F133 (Extended databases)
F134-F141 (Family) → F142-F149 (Family PRS)
```

---

## Effort Estimation Key

| Size | Description | Typical Duration |
|------|-------------|------------------|
| **XS** | Trivial change | <2 hours |
| **S** | Small feature | 2-8 hours |
| **M** | Medium feature | 1-3 days |
| **L** | Large feature | 3-7 days |
| **XL** | Epic-level | 1-3 weeks |

---

**Document Version:** 1.0.0
**Last Updated:** 2026-01-28
**Next Review:** Weekly during active development
