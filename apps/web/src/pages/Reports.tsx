import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useGenomeStore } from '../store/genome';
import { useAnalysisStore } from '../store/analysis';

const reportTypes = [
  {
    id: 'exhaustive_genetic' as const,
    name: 'Complete Genetic Report',
    description: 'Comprehensive analysis including all findings, disease risks, and pharmacogenomics',
    icon: '📋'
  },
  {
    id: 'disease_risk' as const,
    name: 'Disease Risk Report',
    description: 'Pathogenic variants and associated health conditions from ClinVar',
    icon: '🏥'
  },
  {
    id: 'pharmacogenomics' as const,
    name: 'Pharmacogenomics Report',
    description: 'Drug metabolism phenotypes and medication interactions',
    icon: '💊'
  },
  {
    id: 'health_protocol' as const,
    name: 'Health Protocol',
    description: 'Actionable recommendations based on your genetic profile',
    icon: '📝'
  }
];

type ReportType = (typeof reportTypes)[number]['id'];

interface GeneratedReport {
  type: ReportType;
  title: string;
  summary: string;
  sections: Array<{
    title: string;
    content: string;
    items?: string[];
  }>;
  generatedAt: string;
}

export default function ReportsPage() {
  const genome = useGenomeStore((state) => state.genome);
  const { matchResult, enhancedResult } = useAnalysisStore();

  const [generating, setGenerating] = useState<ReportType | null>(null);
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateReport = useCallback(
    async (reportType: ReportType) => {
      if (!genome || !matchResult || !enhancedResult) return;

      setGenerating(reportType);
      setError(null);
      setGeneratedReport(null);

      try {
        // Import the report generator dynamically
        const { ReportGenerator } = await import('@genomeforge/core');

        const generator = new ReportGenerator(
          { analysisResult: enhancedResult, matchResult },
          { type: reportType }
        );
        const report = generator.generate();

        // Convert to simplified format
        const simpleReport: GeneratedReport = {
          type: reportType,
          title: report.title,
          summary: '',
          sections: report.sections.map((s) => ({
            title: s.title,
            content: '',
            items: []
          })),
          generatedAt: report.generatedAt.toISOString()
        };

        setGeneratedReport(simpleReport);
      } catch (err) {
        console.error('Report generation error:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate report');
      } finally {
        setGenerating(null);
      }
    },
    [genome, matchResult, enhancedResult]
  );

  const downloadReport = useCallback(() => {
    if (!generatedReport) return;

    // Generate markdown content
    let markdown = `# ${generatedReport.title}\n\n`;
    markdown += `*Generated: ${new Date(generatedReport.generatedAt).toLocaleString()}*\n\n`;

    if (generatedReport.summary) {
      markdown += `## Summary\n\n${generatedReport.summary}\n\n`;
    }

    for (const section of generatedReport.sections) {
      markdown += `## ${section.title}\n\n`;
      if (section.content) {
        markdown += `${section.content}\n\n`;
      }
      if (section.items && section.items.length > 0) {
        for (const item of section.items) {
          markdown += `- ${item}\n`;
        }
        markdown += '\n';
      }
    }

    markdown += `---\n\n*This report is for informational purposes only.*\n`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `genomeforge-${generatedReport.type}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [generatedReport]);

  if (!genome) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">No Genome Loaded</h1>
        <p className="mt-2 text-gray-600">Upload a genome file to generate reports.</p>
        <Link
          to="/upload"
          className="mt-4 inline-block rounded-lg bg-primary-600 px-6 py-3 text-white font-medium hover:bg-primary-700"
        >
          Upload Genome
        </Link>
      </div>
    );
  }

  if (!matchResult) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">Analysis Required</h1>
        <p className="mt-2 text-gray-600">Run the analysis first to generate reports.</p>
        <Link
          to="/analysis"
          className="mt-4 inline-block rounded-lg bg-primary-600 px-6 py-3 text-white font-medium hover:bg-primary-700"
        >
          Go to Analysis
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Reports</h1>
      <p className="mt-1 text-sm text-gray-600 sm:mt-2 sm:text-base">
        Generate detailed reports based on your genetic analysis.
      </p>

      {/* Error Message */}
      {error && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Report Types */}
      <div className="mt-6 grid gap-3 sm:mt-8 sm:gap-4 md:grid-cols-2">
        {reportTypes.map((report) => (
          <button
            key={report.id}
            disabled={generating !== null}
            onClick={() => generateReport(report.id)}
            className={`rounded-lg border bg-white p-6 text-left transition-colors ${
              generating === report.id
                ? 'border-primary-300 bg-primary-50'
                : 'border-gray-200 hover:border-primary-300'
            } disabled:opacity-50`}
          >
            <div className="flex items-start justify-between">
              <div className="text-3xl mb-4">{report.icon}</div>
              {generating === report.id && (
                <span className="text-xs text-primary-600 animate-pulse">Generating...</span>
              )}
            </div>
            <h3 className="font-semibold text-gray-900">{report.name}</h3>
            <p className="mt-2 text-sm text-gray-600">{report.description}</p>
          </button>
        ))}
      </div>

      {/* Generated Report Preview */}
      {generatedReport && (
        <div className="mt-8">
          <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">Generated Report</h2>
            <div className="flex gap-2">
              <button
                onClick={downloadReport}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Download Markdown
              </button>
              <button
                onClick={() => setGeneratedReport(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Report Info */}
          <div className="mb-4 flex flex-col gap-1 text-sm text-gray-500 sm:flex-row sm:items-center sm:gap-4">
            <span>
              Type:{' '}
              <strong className="text-gray-700">
                {generatedReport.type.replace(/_/g, ' ')}
              </strong>
            </span>
            <span>
              Sections:{' '}
              <strong className="text-gray-700">{generatedReport.sections.length}</strong>
            </span>
            <span>
              Generated:{' '}
              <strong className="text-gray-700">
                {new Date(generatedReport.generatedAt).toLocaleString()}
              </strong>
            </span>
          </div>

          {/* Report Preview */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 max-h-[60vh] sm:max-h-[600px] overflow-y-auto">
            <h1 className="text-xl font-bold text-gray-900 mb-2">{generatedReport.title}</h1>
            {generatedReport.summary && (
              <p className="text-gray-600 mb-6">{generatedReport.summary}</p>
            )}

            {generatedReport.sections.map((section, i) => (
              <div key={i} className="mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">{section.title}</h2>
                {section.content && <p className="text-gray-600 mb-3">{section.content}</p>}
                {section.items && section.items.length > 0 && (
                  <ul className="list-disc list-inside space-y-1">
                    {section.items.slice(0, 10).map((item, j) => (
                      <li key={j} className="text-gray-600">
                        {item}
                      </li>
                    ))}
                    {section.items.length > 10 && (
                      <li className="text-gray-400 italic">
                        ... and {section.items.length - 10} more items
                      </li>
                    )}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-6 sm:mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4 sm:p-6">
        <h3 className="font-semibold text-yellow-800">Important Notice</h3>
        <p className="mt-2 text-sm text-yellow-700">
          These reports are for informational purposes only and should not be used for medical
          diagnosis or treatment decisions. Always consult with qualified healthcare professionals
          before making any medical decisions based on genetic information.
        </p>
      </div>
    </div>
  );
}
