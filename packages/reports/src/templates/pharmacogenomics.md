# Pharmacogenomics Report

**Report ID:** {{reportId}}
**Generated:** {{generatedAt}}
**Genome Build:** {{build}}

---

## Summary

This report analyzes your genetic variants related to drug metabolism, efficacy, and adverse reactions. Information is derived from the Clinical Pharmacogenetics Implementation Consortium (CPIC) and PharmGKB database.

{{#summary}}
{{text}}
{{/summary}}

---

## ⚠️ High-Impact Drug Interactions

**These findings require immediate attention. Discuss with your healthcare provider before taking these medications.**

{{#highImpact}}
### {{drugName}}

| Attribute | Value |
|-----------|-------|
| **Gene** | {{gene}} |
| **Variant** | {{rsid}} |
| **Your Phenotype** | {{phenotype}} |
| **Recommendation** | {{recommendation}} |
| **FDA Label** | {{#hasFDALabel}}Yes{{/hasFDALabel}}{{^hasFDALabel}}No{{/hasFDALabel}} |
| **Evidence Level** | {{evidenceLevel}} |

**Clinical Significance:** {{clinicalSignificance}}

**Action Required:** {{action}}

---
{{/highImpact}}

---

## Drug Metabolism Summary

{{#metabolism}}
### {{gene}}

**Your Phenotype:** {{phenotype}}

| Status | Description |
|--------|-------------|
| Metabolizer Type | {{metabolizerType}} |
| Clinical Implication | {{implication}} |

**Affected Drug Classes:**
{{#drugClasses}}
- {{.}}
{{/drugClasses}}

---
{{/metabolism}}

---

## CYP2D6 Status

{{#cyp2d6}}
- **Diplotype:** {{diplotype}}
- **Activity Score:** {{activityScore}}
- **Phenotype:** {{phenotype}}

### Implications for Common Medications:

| Drug | Category | Standard Dose Effect | Recommendation |
|------|----------|---------------------|----------------|
{{#drugs}}
| {{name}} | {{category}} | {{standardDoseEffect}} | {{recommendation}} |
{{/drugs}}
{{/cyp2d6}}

---

## CYP2C19 Status

{{#cyp2c19}}
- **Diplotype:** {{diplotype}}
- **Phenotype:** {{phenotype}}

### Implications for Common Medications:

| Drug | Category | Your Predicted Response | Recommendation |
|------|----------|------------------------|----------------|
{{#drugs}}
| {{name}} | {{category}} | {{response}} | {{recommendation}} |
{{/drugs}}
{{/cyp2c19}}

---

## CYP2C9 Status

{{#cyp2c9}}
- **Diplotype:** {{diplotype}}
- **Phenotype:** {{phenotype}}

### Affected Medications:

| Drug | Sensitivity | Clinical Consideration |
|------|-------------|----------------------|
{{#drugs}}
| {{name}} | {{sensitivity}} | {{consideration}} |
{{/drugs}}
{{/cyp2c9}}

---

## VKORC1 (Warfarin Sensitivity)

{{#vkorc1}}
- **Variant:** {{variant}}
- **Warfarin Sensitivity:** {{sensitivity}}
- **Dose Implication:** {{doseImplication}}
{{/vkorc1}}

---

## DPYD (Fluoropyrimidine Toxicity)

{{#dpyd}}
- **Status:** {{status}}
- **Risk Level:** {{riskLevel}}
- **Affected Drugs:** 5-fluorouracil, Capecitabine

{{#isHighRisk}}
⚠️ **Warning:** You may be at increased risk for severe toxicity with fluoropyrimidine chemotherapy. Discuss with your oncologist before treatment.
{{/isHighRisk}}
{{/dpyd}}

---

## SLCO1B1 (Statin Myopathy)

{{#slco1b1}}
- **Variant:** {{variant}}
- **Myopathy Risk:** {{riskLevel}}

### Statin Recommendations:

| Statin | Risk Level | Recommendation |
|--------|------------|----------------|
{{#statins}}
| {{name}} | {{risk}} | {{recommendation}} |
{{/statins}}
{{/slco1b1}}

---

## HLA Markers (Hypersensitivity)

{{#hla}}
| Marker | Status | Drug | Risk |
|--------|--------|------|------|
{{#rows}}
| {{marker}} | {{status}} | {{drug}} | {{risk}} |
{{/rows}}
{{/hla}}

---

## Complete Drug Interaction Table

{{#allInteractions}}
| Drug | Gene | Your Genotype | Phenotype | Recommendation | Evidence |
|------|------|---------------|-----------|----------------|----------|
{{#rows}}
| {{drug}} | {{gene}} | {{genotype}} | {{phenotype}} | {{recommendation}} | {{evidence}} |
{{/rows}}
{{/allInteractions}}

---

## Evidence Levels

- **1A**: CPIC guideline, strong evidence
- **1B**: CPIC guideline, moderate evidence
- **2A**: PharmGKB annotation, strong evidence
- **2B**: PharmGKB annotation, moderate evidence
- **3**: Limited evidence, interpretation with caution

---

## How to Use This Report

1. **Share with Healthcare Providers**: Provide this report to your doctors and pharmacists
2. **Before Starting New Medications**: Reference this report when prescribed new drugs
3. **Pharmacy Records**: Some pharmacies can add PGx information to your profile
4. **Not a Substitute for Testing**: Clinical PGx testing may provide additional information

---

## Disclaimer

This pharmacogenomics report is for **informational purposes only**. It is based on genetic analysis using publicly available databases (PharmGKB, CPIC guidelines) and does NOT replace clinical pharmacogenomic testing.

**Important Considerations:**
- Drug response is influenced by many factors beyond genetics
- This analysis may not capture all relevant variants
- Clinical decisions should involve healthcare professionals
- Off-label drug use is not addressed in this report

**Always consult with your physician or pharmacist** before making changes to your medication regimen based on this report.

---

## Data Sources

- Clinical Pharmacogenetics Implementation Consortium (CPIC)
- Pharmacogenomics Knowledge Base (PharmGKB)
- PharmVar (pharmacogene variation database)

*PharmGKB data used under CC BY-SA 4.0 license. Attribution: Whirl-Carrillo M, et al. "PharmGKB: A worldwide resource for pharmacogenomic information."*

---

*Generated by GenomeForge - Your genes, your keys, your insights.*
