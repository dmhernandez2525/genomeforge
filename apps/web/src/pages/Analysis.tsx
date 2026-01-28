import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useGenomeStore } from '../store/genome';
import { useAnalysisStore } from '../store/analysis';
import type { AnnotatedSNP, MatchResult, EnhancedAnalysisResult, PolygenicRiskScore, TraitAssociation } from '@genomeforge/types';

type TabId = 'overview' | 'clinvar' | 'pharmgkb' | 'gwas' | 'prs';

const tabs: { id: TabId; name: string }[] = [
  { id: 'overview', name: 'Overview' },
  { id: 'clinvar', name: 'Disease Risk' },
  { id: 'pharmgkb', name: 'Pharmacogenomics' },
  { id: 'gwas', name: 'Trait Associations' },
  { id: 'prs', name: 'Polygenic Scores' }
];

export default function AnalysisPage() {
  const genome = useGenomeStore((state) => state.genome);
  const {
    matchResult,
    enhancedResult,
    polygenicScores,
    traitAssociations,
    databaseStatus,
    isAnalyzing,
    analysisProgress,
    analysisError,
    setMatchResult,
    setEnhancedResult,
    setPolygenicScores,
    setTraitAssociations,
    updateDatabaseStatus,
    setAnalyzing,
    setAnalysisProgress,
    setAnalysisError
  } = useAnalysisStore();

  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const runAnalysis = useCallback(async () => {
    if (!genome) return;

    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisProgress({ stage: 'Initializing...', percent: 0 });

    try {
      // Import modules dynamically for code splitting
      const [coreModule, dbModule] = await Promise.all([
        import('@genomeforge/core'),
        import('@genomeforge/databases')
      ]);

      const { matchGenome, analyzeGenome } = coreModule;
      const { ClinVarLoader, PharmGKBLoader, GWASLoader } = dbModule;

      // Check if databases are loaded
      setAnalysisProgress({ stage: 'Checking databases...', percent: 10 });

      const [clinvarLoaded, pharmgkbLoaded, gwasLoaded] = await Promise.all([
        ClinVarLoader.isLoaded(),
        PharmGKBLoader.isLoaded(),
        GWASLoader.isLoaded()
      ]);

      updateDatabaseStatus('clinvar', { loaded: clinvarLoaded });
      updateDatabaseStatus('pharmgkb', { loaded: pharmgkbLoaded });
      updateDatabaseStatus('gwas', { loaded: gwasLoaded });

      if (!clinvarLoaded || !pharmgkbLoaded) {
        setAnalysisError(
          'Clinical databases not loaded. Please load ClinVar and PharmGKB databases first in the Database Management section.'
        );
        setAnalyzing(false);
        return;
      }

      // Create database interface for the matcher
      setAnalysisProgress({ stage: 'Matching variants against databases...', percent: 30 });

      const rsids = Array.from(genome.snps.keys());

      // Batch lookup from databases
      const [clinvarMap, pharmgkbMap, gwasMap] = await Promise.all([
        ClinVarLoader.lookupBatch(rsids),
        PharmGKBLoader.lookupBatch(rsids),
        gwasLoaded ? GWASLoader.lookupBatch(rsids) : Promise.resolve(new Map())
      ]);

      // Convert to the expected format for matchGenome
      const dbInterface = {
        getClinVar: async (ids: string[]) => {
          const result = new Map();
          for (const id of ids) {
            const record = clinvarMap.get(id);
            if (record) {
              result.set(id, {
                rsId: record.rsid,
                gene: record.gene,
                clinicalSignificance: record.clinicalSignificance,
                conditions: record.conditions,
                reviewStatus: record.reviewStatus
              });
            }
          }
          return result;
        },
        getPharmGKB: async (ids: string[]) => {
          const result = new Map();
          for (const id of ids) {
            const record = pharmgkbMap.get(id);
            if (record) {
              result.set(id, {
                rsId: record.rsid,
                gene: record.gene,
                drugs: record.drugs || []
              });
            }
          }
          return result;
        },
        getGnomAD: async () => new Map(),
        getGWAS: async (ids: string[]) => {
          const result = new Map();
          for (const id of ids) {
            const records = gwasMap.get(id);
            if (records && records.length > 0) {
              result.set(id, records);
            }
          }
          return result;
        },
        getVersions: async () => ({
          clinvar: 'loaded',
          pharmgkb: 'loaded',
          gwas: gwasLoaded ? 'loaded' : 'not_loaded'
        })
      };

      setAnalysisProgress({ stage: 'Running variant matching...', percent: 50 });

      const result = await matchGenome(genome, dbInterface, {
        includeGWAS: gwasLoaded
      });

      setMatchResult(result);

      // Get stats
      const [clinvarStats, pharmgkbStats] = await Promise.all([
        ClinVarLoader.getStats(),
        PharmGKBLoader.getStats()
      ]);

      updateDatabaseStatus('clinvar', { count: clinvarStats.totalRecords });
      updateDatabaseStatus('pharmgkb', { count: pharmgkbStats.totalRecords });

      if (gwasLoaded) {
        const gwasStats = await GWASLoader.getStats();
        updateDatabaseStatus('gwas', { count: gwasStats.totalRecords });
      }

      // Run enhanced analysis
      setAnalysisProgress({ stage: 'Running advanced analysis...', percent: 75 });

      const enhanced = await analyzeGenome(result);
      setEnhancedResult(enhanced);

      // Calculate trait associations and PRS if GWAS data available
      if (gwasLoaded && result.gwasAssociationCount > 0) {
        // Placeholder: actual GWAS analysis requires additional implementation
        setTraitAssociations([]);
        setPolygenicScores([]);
      }

      setAnalysisProgress({ stage: 'Analysis complete!', percent: 100 });
      setActiveTab('overview');
    } catch (err) {
      console.error('Analysis error:', err);
      setAnalysisError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
      setTimeout(() => setAnalysisProgress(null), 1000);
    }
  }, [
    genome,
    setMatchResult,
    setEnhancedResult,
    setPolygenicScores,
    setTraitAssociations,
    updateDatabaseStatus,
    setAnalyzing,
    setAnalysisProgress,
    setAnalysisError
  ]);

  if (!genome) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">No Genome Loaded</h1>
        <p className="mt-2 text-gray-600">Upload a genome file to view analysis.</p>
        <Link
          to="/upload"
          className="mt-4 inline-block rounded-lg bg-primary-600 px-6 py-3 text-white font-medium hover:bg-primary-700"
        >
          Upload Genome
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Genome Analysis</h1>
          <p className="mt-1 text-gray-600">
            {genome.snpCount.toLocaleString()} variants from {genome.format} format
          </p>
        </div>
        {!matchResult && (
          <button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="rounded-lg bg-primary-600 px-6 py-3 text-white font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {analysisProgress && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">{analysisProgress.stage}</span>
            <span className="text-sm text-gray-500">{analysisProgress.percent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${analysisProgress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {analysisError && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
          {analysisError}
        </div>
      )}

      {/* Database Status */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <DatabaseStatusCard
          name="ClinVar"
          status={databaseStatus.clinvar}
          description="Pathogenic variants"
        />
        <DatabaseStatusCard
          name="PharmGKB"
          status={databaseStatus.pharmgkb}
          description="Drug interactions"
        />
        <DatabaseStatusCard
          name="GWAS Catalog"
          status={databaseStatus.gwas}
          description="Trait associations"
        />
      </div>

      {/* Analysis Results */}
      {matchResult && (
        <>
          {/* Tabs */}
          <div className="mt-8 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'overview' && (
              <OverviewTab result={matchResult} enhanced={enhancedResult} />
            )}
            {activeTab === 'clinvar' && <ClinVarTab result={matchResult} />}
            {activeTab === 'pharmgkb' && <PharmGKBTab result={matchResult} enhanced={enhancedResult} />}
            {activeTab === 'gwas' && <GWASTab associations={traitAssociations} />}
            {activeTab === 'prs' && <PRSTab scores={polygenicScores} />}
          </div>
        </>
      )}

      {/* Quick Links */}
      {matchResult && (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Link
            to="/reports"
            className="rounded-lg border border-gray-200 bg-white p-6 hover:border-primary-300 transition-colors"
          >
            <h3 className="font-semibold text-gray-900">Generate Reports</h3>
            <p className="mt-2 text-sm text-gray-600">
              Create detailed PDF reports of your analysis results.
            </p>
          </Link>
          <Link
            to="/chat"
            className="rounded-lg border border-gray-200 bg-white p-6 hover:border-primary-300 transition-colors"
          >
            <h3 className="font-semibold text-gray-900">Chat with AI</h3>
            <p className="mt-2 text-sm text-gray-600">
              Ask questions about your genetic findings using AI.
            </p>
          </Link>
        </div>
      )}
    </div>
  );
}

function DatabaseStatusCard({
  name,
  status,
  description
}: {
  name: string;
  status: { loaded: boolean; count: number; loading: boolean; error: string | null };
  description: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">{name}</h3>
        {status.loading ? (
          <span className="text-xs text-blue-600">Loading...</span>
        ) : status.loaded ? (
          <span className="text-xs text-green-600">Loaded</span>
        ) : status.error ? (
          <span className="text-xs text-red-600">Error</span>
        ) : (
          <span className="text-xs text-gray-400">Not loaded</span>
        )}
      </div>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
      {status.loaded && status.count > 0 && (
        <p className="text-lg font-semibold text-gray-900 mt-2">
          {status.count.toLocaleString()} records
        </p>
      )}
      {status.error && <p className="text-xs text-red-500 mt-2">{status.error}</p>}
    </div>
  );
}

function OverviewTab({
  result,
  enhanced
}: {
  result: MatchResult;
  enhanced: EnhancedAnalysisResult | null;
}) {
  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Total Variants"
          value={result.totalSNPs.toLocaleString()}
          color="gray"
        />
        <StatCard
          label="Pathogenic Variants"
          value={result.pathogenicCount.toString()}
          color={result.pathogenicCount > 0 ? 'red' : 'green'}
        />
        <StatCard
          label="Drug Interactions"
          value={result.drugInteractionCount.toString()}
          color={result.drugInteractionCount > 0 ? 'yellow' : 'green'}
        />
        <StatCard
          label="GWAS Associations"
          value={result.gwasAssociationCount.toString()}
          color="blue"
        />
      </div>

      {/* Risk Assessments */}
      {enhanced?.riskAssessments && enhanced.riskAssessments.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Key Risk Assessments</h3>
          <div className="space-y-3">
            {enhanced.riskAssessments.slice(0, 5).map((assessment, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border ${
                  assessment.riskLevel === 'high'
                    ? 'bg-red-50 border-red-200'
                    : assessment.riskLevel === 'moderate'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-medium text-gray-900">{assessment.condition}</span>
                    <p className="text-sm text-gray-600 mt-1">Gene: {assessment.gene}</p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      assessment.riskLevel === 'high'
                        ? 'bg-red-100 text-red-700'
                        : assessment.riskLevel === 'moderate'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {assessment.riskLevel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medical Disclaimer */}
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <p className="text-sm text-yellow-700">
          <strong>Important:</strong> These results are for informational purposes only. Consult a
          healthcare professional before making any medical decisions.
        </p>
      </div>
    </div>
  );
}

function ClinVarTab({ result }: { result: MatchResult }) {
  const pathogenicVariants = result.annotatedSNPs.filter(
    (snp) =>
      snp.clinvar?.clinicalSignificance === 'pathogenic' ||
      snp.clinvar?.clinicalSignificance === 'likely_pathogenic'
  );

  const vusVariants = result.annotatedSNPs.filter(
    (snp) => snp.clinvar?.clinicalSignificance === 'uncertain_significance'
  );

  return (
    <div className="space-y-6">
      {/* Pathogenic Variants */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="font-semibold text-gray-900">
            Pathogenic Variants ({pathogenicVariants.length})
          </h3>
        </div>
        {pathogenicVariants.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {pathogenicVariants.slice(0, 20).map((variant, i) => (
              <VariantRow key={i} variant={variant} />
            ))}
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-gray-500">
            No pathogenic variants found
          </div>
        )}
      </div>

      {/* VUS */}
      {vusVariants.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="font-semibold text-gray-900">
              Variants of Uncertain Significance ({vusVariants.length})
            </h3>
          </div>
          <div className="px-6 py-4 text-sm text-gray-600">
            <p>
              {vusVariants.length} variants have uncertain clinical significance. These may be
              reclassified as more evidence becomes available.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function PharmGKBTab({
  result,
  enhanced
}: {
  result: MatchResult;
  enhanced: EnhancedAnalysisResult | null;
}) {
  const drugVariants = result.annotatedSNPs.filter(
    (snp) => snp.pharmgkb && snp.pharmgkb.drugs.length > 0
  );

  return (
    <div className="space-y-6">
      {/* Metabolizer Phenotypes */}
      {enhanced?.metabolizerPhenotypes &&
        enhanced.metabolizerPhenotypes.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="font-semibold text-gray-900">Metabolizer Phenotypes</h3>
            </div>
            <div className="grid gap-4 p-6 md:grid-cols-2">
              {enhanced.metabolizerPhenotypes.map((phenotype, i) => (
                <div key={i} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{phenotype.gene}</span>
                    <PhenotypeBadge phenotype={phenotype.phenotype} />
                  </div>
                  {phenotype.diplotype && (
                    <p className="text-sm text-gray-500 mt-1">Diplotype: {phenotype.diplotype}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Drug Interactions */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="font-semibold text-gray-900">
            Drug Interactions ({drugVariants.length})
          </h3>
        </div>
        {drugVariants.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {drugVariants.slice(0, 20).map((variant, i) => (
              <div key={i} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{variant.snp.rsid}</span>
                  {variant.pharmgkb?.gene && (
                    <span className="text-sm text-gray-500">{variant.pharmgkb.gene}</span>
                  )}
                </div>
                {variant.pharmgkb?.drugs.map((drug, j) => (
                  <div key={j} className="mt-2 text-sm">
                    <span className="font-medium text-blue-600">{drug.drugName}</span>
                    <span className="ml-2 text-xs text-gray-400">
                      Evidence: {drug.evidenceLevel}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-gray-500">No drug interactions found</div>
        )}
      </div>
    </div>
  );
}

function GWASTab({ associations }: { associations: TraitAssociation[] }) {
  const sortedAssociations = [...associations].sort((a, b) => b.riskScore - a.riskScore);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="font-semibold text-gray-900">
            Trait Associations ({sortedAssociations.length})
          </h3>
        </div>
        {sortedAssociations.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {sortedAssociations.slice(0, 30).map((trait, i) => (
              <div key={i} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{trait.trait}</span>
                  <span className="text-sm text-gray-500 capitalize">{trait.category}</span>
                </div>
                <div className="mt-2 flex items-center gap-4 text-sm">
                  <span className="text-gray-600">
                    Score: <strong>{(trait.riskScore * 100).toFixed(0)}%</strong>
                  </span>
                  <span className="text-gray-600">
                    Variants: <strong>{trait.variantCount}</strong>
                  </span>
                  <RiskBadge level={trait.interpretation} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-gray-500">
            No trait associations found. Run analysis to match against GWAS Catalog.
          </div>
        )}
      </div>
    </div>
  );
}

function PRSTab({ scores }: { scores: PolygenicRiskScore[] }) {
  const sortedScores = [...scores].sort(
    (a, b) => Math.abs(b.percentile - 50) - Math.abs(a.percentile - 50)
  );

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h3 className="font-medium text-blue-800">About Polygenic Risk Scores</h3>
        <p className="text-sm text-blue-700 mt-1">
          PRS combine the effects of many genetic variants to estimate overall risk for complex
          traits. Scores are compared against a reference population.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="font-semibold text-gray-900">
            Polygenic Risk Scores ({sortedScores.length})
          </h3>
        </div>
        {sortedScores.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {sortedScores.slice(0, 20).map((score, i) => (
              <div key={i} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{score.trait}</span>
                  <RiskBadge level={score.riskCategory.replace(/_/g, ' ')} />
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                    <span>Percentile</span>
                    <span>{score.percentile.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        score.percentile > 80
                          ? 'bg-red-500'
                          : score.percentile > 60
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                      }`}
                      style={{ width: `${score.percentile}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Based on {score.variantsUsed} variants | z-score: {score.zScore.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-gray-500">
            No polygenic risk scores available. Run analysis to calculate PRS.
          </div>
        )}
      </div>
    </div>
  );
}

function VariantRow({ variant }: { variant: AnnotatedSNP }) {
  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-medium text-gray-900">{variant.snp.rsid}</span>
          {variant.clinvar?.gene && (
            <span className="ml-2 text-sm text-gray-500">({variant.clinvar.gene})</span>
          )}
        </div>
        {variant.clinvar && (
          <SignificanceBadge significance={variant.clinvar.clinicalSignificance} />
        )}
      </div>
      {variant.clinvar?.conditions && variant.clinvar.conditions.length > 0 && (
        <p className="text-sm text-gray-600 mt-1">
          {variant.clinvar.conditions.map((c) => c.name).join(', ')}
        </p>
      )}
      <p className="text-xs text-gray-400 mt-1">
        Genotype: {variant.snp.genotype} | Chr{variant.snp.chromosome}:{variant.snp.position}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  color
}: {
  label: string;
  value: string;
  color: 'gray' | 'red' | 'yellow' | 'green' | 'blue';
}) {
  const colorClasses = {
    gray: 'text-gray-900',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    green: 'text-green-600',
    blue: 'text-blue-600'
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

function SignificanceBadge({ significance }: { significance: string }) {
  const colors: Record<string, string> = {
    pathogenic: 'bg-red-100 text-red-700',
    likely_pathogenic: 'bg-orange-100 text-orange-700',
    uncertain_significance: 'bg-yellow-100 text-yellow-700',
    likely_benign: 'bg-green-100 text-green-700',
    benign: 'bg-green-100 text-green-700'
  };

  return (
    <span
      className={`text-xs font-medium px-2 py-1 rounded ${colors[significance] || 'bg-gray-100 text-gray-700'}`}
    >
      {significance.replace(/_/g, ' ')}
    </span>
  );
}

function PhenotypeBadge({ phenotype }: { phenotype: string }) {
  const colors: Record<string, string> = {
    'poor metabolizer': 'bg-red-100 text-red-700',
    'intermediate metabolizer': 'bg-yellow-100 text-yellow-700',
    'normal metabolizer': 'bg-green-100 text-green-700',
    'rapid metabolizer': 'bg-blue-100 text-blue-700',
    'ultrarapid metabolizer': 'bg-purple-100 text-purple-700'
  };

  return (
    <span
      className={`text-xs font-medium px-2 py-1 rounded ${colors[phenotype.toLowerCase()] || 'bg-gray-100 text-gray-700'}`}
    >
      {phenotype}
    </span>
  );
}

function RiskBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    high: 'bg-red-100 text-red-700',
    elevated: 'bg-orange-100 text-orange-700',
    moderate: 'bg-yellow-100 text-yellow-700',
    average: 'bg-gray-100 text-gray-700',
    low: 'bg-green-100 text-green-700',
    reduced: 'bg-green-100 text-green-700'
  };

  return (
    <span
      className={`text-xs font-medium px-2 py-1 rounded capitalize ${colors[level.toLowerCase()] || 'bg-gray-100 text-gray-700'}`}
    >
      {level}
    </span>
  );
}
