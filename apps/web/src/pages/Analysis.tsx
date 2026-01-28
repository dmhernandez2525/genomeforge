import { Link } from 'react-router-dom';
import { useGenomeStore } from '../store/genome';

export default function AnalysisPage() {
  const genome = useGenomeStore((state) => state.genome);

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
      <h1 className="text-3xl font-bold text-gray-900">Genome Analysis</h1>
      <p className="mt-2 text-gray-600">
        Analysis of {genome.snpCount.toLocaleString()} variants from {genome.format} format
      </p>

      {/* Summary Stats */}
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="text-2xl font-bold text-gray-900">{genome.snpCount.toLocaleString()}</div>
          <div className="text-sm text-gray-500">Total Variants</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="text-2xl font-bold text-gray-900">{genome.format}</div>
          <div className="text-sm text-gray-500">File Format</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="text-2xl font-bold text-gray-900">GRCh{genome.build}</div>
          <div className="text-sm text-gray-500">Genome Build</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="text-2xl font-bold text-green-600">Valid</div>
          <div className="text-sm text-gray-500">File Status</div>
        </div>
      </div>

      {/* Analysis Status */}
      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Database Matching</h2>
        <p className="mt-2 text-gray-600">
          Click the button below to match your variants against clinical databases.
        </p>
        <button
          className="mt-4 rounded-lg bg-primary-600 px-6 py-3 text-white font-medium hover:bg-primary-700"
          onClick={() => {
            // TODO: Implement database matching
            alert('Database matching coming soon!');
          }}
        >
          Run Analysis
        </button>
      </div>

      {/* Quick Links */}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Link
          to="/reports"
          className="rounded-lg border border-gray-200 bg-white p-6 hover:border-primary-300 transition-colors"
        >
          <h3 className="font-semibold text-gray-900">View Reports</h3>
          <p className="mt-2 text-sm text-gray-600">
            Generate health risk, pharmacogenomics, and carrier status reports.
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
    </div>
  );
}
