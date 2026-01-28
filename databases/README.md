# GenomeForge Database Files

This directory contains pre-processed clinical database files for local genetic analysis.

## Bundled Databases

### ClinVar (Required)
- **Source:** https://ftp.ncbi.nlm.nih.gov/pub/clinvar/vcf_GRCh38/
- **License:** Public Domain (US Government Work)
- **Size:** ~173MB compressed
- **Contents:** 341K+ clinical variant annotations
- **Update Frequency:** Weekly

**Download Instructions:**
```bash
# Download latest ClinVar VCF
curl -O https://ftp.ncbi.nlm.nih.gov/pub/clinvar/vcf_GRCh38/clinvar.vcf.gz

# Process with provided script
python scripts/process_clinvar.py clinvar.vcf.gz databases/clinvar/clinvar-snps.json.gz
```

### PharmGKB (Required)
- **Source:** https://www.pharmgkb.org/downloads
- **License:** CC BY-SA 4.0
- **Size:** ~50MB
- **Contents:** 715+ drug-gene annotations, CPIC guidelines
- **Update Frequency:** Monthly

**Attribution Required:**
> Pharmacogenomics data provided by PharmGKB (https://www.pharmgkb.org)

**Download Instructions:**
1. Visit https://www.pharmgkb.org/downloads
2. Download "Clinical Annotations" and "Drug Labels"
3. Process with provided script:
```bash
python scripts/process_pharmgkb.py --input pharmgkb-data/ --output databases/pharmgkb/
```

## Optional Databases

### GWAS Catalog
- **Source:** https://www.ebi.ac.uk/gwas/docs/file-downloads
- **License:** CC0 (post-March 2021)
- **Size:** ~500MB
- **Contents:** 625K+ trait associations
- **Platform:** Desktop only (too large for mobile)

### gnomAD (Population Frequencies)
- **Source:** https://gnomad.broadinstitute.org/downloads
- **License:** ODbL 1.0
- **Size:** ~100MB (subset)
- **Contents:** Allele frequencies for 9 populations

## Database NOT Available

### SNPedia
**SNPedia is NOT available for commercial use.** MyHeritage holds exclusive commercial rights since their September 2019 acquisition. The database content is covered by CC BY-NC-SA 3.0, but commercial licensing is not offered to third parties.

**Alternative:** Use ClinVar + PharmGKB + GWAS Catalog for equivalent coverage.

## Processing Scripts

Scripts for processing raw database files are in `/scripts/`:
- `process_clinvar.py` - Convert ClinVar VCF to optimized JSON
- `process_pharmgkb.py` - Process PharmGKB downloads
- `process_gwas.py` - Process GWAS Catalog
- `update_databases.py` - Check for and apply updates

## File Structure

```
databases/
├── clinvar/
│   └── clinvar-snps.json.gz   # Processed ClinVar data
├── pharmgkb/
│   ├── drug-gene.json.gz       # Drug-gene interactions
│   └── cpic-guidelines.json.gz # CPIC dosing guidelines
├── gwas/
│   └── gwas-catalog.json.gz    # GWAS associations (optional)
└── README.md
```

## Update Schedule

| Database | Frequency | Method |
|----------|-----------|--------|
| ClinVar | Weekly | Delta updates |
| PharmGKB | Monthly | Full refresh |
| GWAS | Biweekly | Delta updates |
| gnomAD | Per release | Full refresh |

## Validation

After processing, validate database integrity:
```bash
pnpm run validate-databases
```

This checks:
- File integrity (checksums)
- Record counts
- Schema compliance
- rsID format validation
