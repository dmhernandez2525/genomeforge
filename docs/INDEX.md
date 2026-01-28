# GenomeForge Documentation Index

**Version:** 1.0.0
**Last Updated:** 2026-01-28

---

## Quick Links

| Document | Description |
|----------|-------------|
| [ROADMAP.md](./ROADMAP.md) | Phase-by-phase implementation plan |
| [FEATURE_BACKLOG.md](./FEATURE_BACKLOG.md) | Complete feature list with priorities |
| [ARCHITECTURE_PATTERNS.md](./ARCHITECTURE_PATTERNS.md) | Technical architecture decisions |
| [PRIVACY_ARCHITECTURE.md](./PRIVACY_ARCHITECTURE.md) | Security and privacy implementation |

---

## Software Design Documents

### Phase 1 SDDs
| Document | Feature |
|----------|---------|
| [Genome Parser SDD](./sdd/phase-1/GENOME_PARSER.md) | Multi-format file parsing |
| [Database Matcher SDD](./sdd/phase-1/DATABASE_MATCHER.md) | ClinVar/PharmGKB integration |
| [BYOK AI Integration SDD](./sdd/phase-1/BYOK_AI.md) | AI provider abstraction |
| [Report Generator SDD](./sdd/phase-1/REPORT_GENERATOR.md) | PDF report generation |

### Phase 2 SDDs
| Document | Feature |
|----------|---------|
| [Mobile Architecture SDD](./sdd/phase-2/MOBILE_ARCHITECTURE.md) | iOS/Android apps |
| [Ollama Integration SDD](./sdd/phase-2/OLLAMA_INTEGRATION.md) | Local AI processing |

### Phase 3 SDDs
| Document | Feature |
|----------|---------|
| [Desktop Apps SDD](./sdd/phase-3/DESKTOP_APPS.md) | macOS/Windows native |
| [Extended Databases SDD](./sdd/phase-3/EXTENDED_DATABASES.md) | GWAS Catalog |

---

## Development Resources

| Resource | Location |
|----------|----------|
| Work Status | [../roadmap/WORK_STATUS.md](../roadmap/WORK_STATUS.md) |
| Agent Logs | [../roadmap/AGENT_LOGS/](../roadmap/AGENT_LOGS/) |
| Research | [Research Sessions](../../_@agent-prompts/GenomeForge/research/) |

---

## External References

### Databases
- [ClinVar](https://www.ncbi.nlm.nih.gov/clinvar/) - Public domain variants
- [PharmGKB](https://www.pharmgkb.org/) - Drug-gene interactions (CC BY-SA 4.0)
- [GWAS Catalog](https://www.ebi.ac.uk/gwas/) - Trait associations (CC0)
- [gnomAD](https://gnomad.broadinstitute.org/) - Population frequencies (ODbL)

### Libraries
- [snps](https://github.com/apriha/snps) - File parsing patterns (BSD-3)
- [PharmCAT](https://github.com/PharmGKB/PharmCAT) - PGx methodology (MPL-2.0)
- [IGV.js](https://github.com/igvteam/igv.js) - Genome browser (MIT)
- [@react-pdf/renderer](https://github.com/diegomura/react-pdf) - PDF generation (MIT)

### Regulatory
- [FDA General Wellness Policy](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/general-wellness-policy-low-risk-devices)
- [EU IVDR](https://eur-lex.europa.eu/eli/reg/2017/746/oj) - In vitro diagnostics regulation
