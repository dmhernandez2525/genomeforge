/**
 * Family Sharing Service
 *
 * Enables local sharing of genetic data between family members.
 * All data stays on device - no cloud connectivity.
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Crypto from 'expo-crypto';
import type { ParsedGenome } from './genomeParser';
import type { AnalysisResult } from './genomeAnalysis';

export type Relationship =
  | 'self'
  | 'parent'
  | 'child'
  | 'sibling'
  | 'grandparent'
  | 'grandchild'
  | 'aunt_uncle'
  | 'niece_nephew'
  | 'cousin'
  | 'spouse'
  | 'other';

export interface FamilyMember {
  id: string;
  name: string;
  relationship: Relationship;
  birthYear?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;

  // Genetic data (optional, loaded when available)
  hasGenomeData: boolean;
  genomeFilename?: string;
  variantCount?: number;
}

export interface FamilyMemberWithData extends FamilyMember {
  genomeData?: ParsedGenome;
  analysisResult?: AnalysisResult;
}

export interface SharedVariant {
  rsid: string;
  chromosome: string;
  position: number;
  members: {
    memberId: string;
    memberName: string;
    genotype: string;
  }[];
  isShared: boolean;
  clinicalSignificance?: string;
  gene?: string;
}

export interface FamilyComparison {
  member1Id: string;
  member1Name: string;
  member2Id: string;
  member2Name: string;
  sharedVariants: SharedVariant[];
  uniqueToMember1: number;
  uniqueToMember2: number;
  totalCompared: number;
  estimatedRelatedness: number;
}

export interface ExportedFamilyData {
  version: string;
  exportedAt: string;
  member: {
    name: string;
    relationship: Relationship;
    birthYear?: number;
  };
  genomeData: {
    filename: string;
    variantCount: number;
    variants: { rsid: string; chromosome: string; position: number; genotype: string }[];
  };
  analysisResult?: {
    clinicalFindingCount: number;
    drugResponseCount: number;
    traitCount: number;
  };
  checksum: string;
}

/**
 * Generate a unique family member ID
 */
export function generateMemberId(): string {
  return `family_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get relationship label for display
 */
export function getRelationshipLabel(relationship: Relationship): string {
  const labels: Record<Relationship, string> = {
    self: 'Self',
    parent: 'Parent',
    child: 'Child',
    sibling: 'Sibling',
    grandparent: 'Grandparent',
    grandchild: 'Grandchild',
    aunt_uncle: 'Aunt/Uncle',
    niece_nephew: 'Niece/Nephew',
    cousin: 'Cousin',
    spouse: 'Spouse',
    other: 'Other',
  };
  return labels[relationship] || 'Other';
}

/**
 * Get expected genetic sharing percentage based on relationship
 */
export function getExpectedSharing(relationship: Relationship): number {
  const sharing: Record<Relationship, number> = {
    self: 1.0,
    parent: 0.5,
    child: 0.5,
    sibling: 0.5,
    grandparent: 0.25,
    grandchild: 0.25,
    aunt_uncle: 0.25,
    niece_nephew: 0.25,
    cousin: 0.125,
    spouse: 0,
    other: 0,
  };
  return sharing[relationship] ?? 0;
}

/**
 * Compare variants between two family members
 */
export function compareVariants(
  member1: FamilyMemberWithData,
  member2: FamilyMemberWithData
): FamilyComparison {
  if (!member1.genomeData?.variants || !member2.genomeData?.variants) {
    return {
      member1Id: member1.id,
      member1Name: member1.name,
      member2Id: member2.id,
      member2Name: member2.name,
      sharedVariants: [],
      uniqueToMember1: 0,
      uniqueToMember2: 0,
      totalCompared: 0,
      estimatedRelatedness: 0,
    };
  }

  const variants1 = member1.genomeData.variants;
  const variants2 = member2.genomeData.variants;

  const sharedVariants: SharedVariant[] = [];
  let matchingAlleles = 0;
  let totalAlleles = 0;

  // Find variants present in both
  const commonRsids = new Set<string>();
  for (const rsid of variants1.keys()) {
    if (variants2.has(rsid)) {
      commonRsids.add(rsid);
    }
  }

  for (const rsid of commonRsids) {
    const v1 = variants1.get(rsid)!;
    const v2 = variants2.get(rsid)!;

    const alleles1 = v1.genotype.split(/[\/|]/);
    const alleles2 = v2.genotype.split(/[\/|]/);

    // Count matching alleles
    for (const a1 of alleles1) {
      if (alleles2.includes(a1)) {
        matchingAlleles++;
      }
      totalAlleles++;
    }

    const isShared = v1.genotype === v2.genotype;

    sharedVariants.push({
      rsid,
      chromosome: v1.chromosome,
      position: v1.position,
      members: [
        { memberId: member1.id, memberName: member1.name, genotype: v1.genotype },
        { memberId: member2.id, memberName: member2.name, genotype: v2.genotype },
      ],
      isShared,
    });
  }

  const estimatedRelatedness = totalAlleles > 0 ? matchingAlleles / totalAlleles : 0;

  return {
    member1Id: member1.id,
    member1Name: member1.name,
    member2Id: member2.id,
    member2Name: member2.name,
    sharedVariants,
    uniqueToMember1: variants1.size - commonRsids.size,
    uniqueToMember2: variants2.size - commonRsids.size,
    totalCompared: commonRsids.size,
    estimatedRelatedness,
  };
}

/**
 * Find variants shared across multiple family members
 */
export function findFamilyVariants(
  members: FamilyMemberWithData[],
  rsids: string[]
): SharedVariant[] {
  const results: SharedVariant[] = [];

  for (const rsid of rsids) {
    const membersWithVariant: SharedVariant['members'] = [];
    let chromosome = '';
    let position = 0;

    for (const member of members) {
      if (member.genomeData?.variants?.has(rsid)) {
        const variant = member.genomeData.variants.get(rsid)!;
        membersWithVariant.push({
          memberId: member.id,
          memberName: member.name,
          genotype: variant.genotype,
        });
        chromosome = variant.chromosome;
        position = variant.position;
      }
    }

    if (membersWithVariant.length > 0) {
      const allGenotypes = membersWithVariant.map((m) => m.genotype);
      const isShared = new Set(allGenotypes).size === 1;

      results.push({
        rsid,
        chromosome,
        position,
        members: membersWithVariant,
        isShared,
      });
    }
  }

  return results;
}

/**
 * Export family member data for sharing
 */
export async function exportMemberData(
  member: FamilyMemberWithData
): Promise<string | null> {
  if (!member.genomeData) {
    return null;
  }

  // Convert variants Map to array for export
  const variantsArray: ExportedFamilyData['genomeData']['variants'] = [];
  if (member.genomeData.variants) {
    for (const [rsid, variant] of member.genomeData.variants.entries()) {
      variantsArray.push({
        rsid,
        chromosome: variant.chromosome,
        position: variant.position,
        genotype: variant.genotype,
      });
    }
  }

  const exportData: ExportedFamilyData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    member: {
      name: member.name,
      relationship: member.relationship,
      birthYear: member.birthYear,
    },
    genomeData: {
      filename: member.genomeFilename || 'unknown',
      variantCount: variantsArray.length,
      variants: variantsArray,
    },
    analysisResult: member.analysisResult
      ? {
          clinicalFindingCount: member.analysisResult.clinicalFindings.length,
          drugResponseCount: member.analysisResult.drugResponses.length,
          traitCount: member.analysisResult.traitAssociations.length,
        }
      : undefined,
    checksum: '', // Will be computed
  };

  // Compute checksum for data integrity
  const dataStr = JSON.stringify({
    ...exportData,
    checksum: undefined,
  });
  const checksum = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    dataStr
  );
  exportData.checksum = checksum;

  // Save to file
  const filename = `genomeforge_${member.name.replace(/\s+/g, '_')}_${Date.now()}.json`;
  const filePath = `${FileSystem.documentDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(filePath, JSON.stringify(exportData, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  // Share the file
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'application/json',
      dialogTitle: `Share ${member.name}'s Genetic Data`,
    });
  }

  return filePath;
}

/**
 * Validate imported family data
 */
export async function validateImportedData(data: unknown): Promise<{
  valid: boolean;
  error?: string;
  data?: ExportedFamilyData;
}> {
  try {
    const exportData = data as ExportedFamilyData;

    // Check required fields
    if (!exportData.version || !exportData.member || !exportData.genomeData) {
      return { valid: false, error: 'Invalid file format' };
    }

    // Verify checksum
    const originalChecksum = exportData.checksum;
    const dataStr = JSON.stringify({
      ...exportData,
      checksum: undefined,
    });
    const computedChecksum = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      dataStr
    );

    if (computedChecksum !== originalChecksum) {
      return { valid: false, error: 'Data integrity check failed' };
    }

    return { valid: true, data: exportData };
  } catch {
    return { valid: false, error: 'Failed to parse file' };
  }
}

/**
 * Get inheritance pattern suggestions based on family data
 */
export function analyzeInheritancePattern(
  members: FamilyMemberWithData[],
  rsid: string
): {
  pattern: string;
  description: string;
  confidence: number;
} {
  const memberVariants = members
    .filter((m) => m.genomeData?.variants?.has(rsid))
    .map((m) => ({
      relationship: m.relationship,
      genotype: m.genomeData!.variants!.get(rsid)!.genotype,
    }));

  if (memberVariants.length < 2) {
    return {
      pattern: 'Unknown',
      description: 'Insufficient family data for inheritance analysis',
      confidence: 0,
    };
  }

  // Simple pattern detection - this would be more sophisticated in a real implementation
  const hasParent = memberVariants.some((m) => m.relationship === 'parent');
  const hasChild = memberVariants.some((m) => m.relationship === 'child');

  if (hasParent && hasChild) {
    const parentGenotypes = memberVariants
      .filter((m) => m.relationship === 'parent')
      .map((m) => m.genotype);
    const childGenotype = memberVariants.find((m) => m.relationship === 'child')?.genotype;

    if (childGenotype && parentGenotypes.length > 0) {
      // Check if variant is present in parent and inherited
      const inherited = parentGenotypes.some((pg) => {
        const parentAlleles = pg.split(/[\/|]/);
        const childAlleles = childGenotype.split(/[\/|]/);
        return parentAlleles.some((a) => childAlleles.includes(a));
      });

      if (inherited) {
        return {
          pattern: 'Inherited',
          description: 'This variant appears to be inherited from a parent',
          confidence: 0.8,
        };
      }
    }
  }

  return {
    pattern: 'Undetermined',
    description: 'Could not determine inheritance pattern with available data',
    confidence: 0.3,
  };
}
