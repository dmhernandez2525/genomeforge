import { Link } from 'react-router-dom';
import { Activity, AlertCircle, Pill, Dna, Upload } from 'lucide-react';
import { useAppStore } from '@/store/app';

export default function AnalysisPage() {
  const { hasGenomeData, analysisResult, genomeData } = useAppStore();

  if (!hasGenomeData) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <Activity className="text-gray-400" size={40} />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No Analysis Data</h2>
          <p className="text-gray-500 mb-4">Upload your genetic data to see analysis results</p>
          <Link to="/upload" className="btn-win btn-win-accent inline-flex items-center gap-2">
            <Upload size={16} />
            Upload DNA Data
          </Link>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Clinical Findings', value: analysisResult?.clinicalVariants || 0, icon: <AlertCircle size={20} />, color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
    { label: 'Drug Responses', value: analysisResult?.pharmacogenomicVariants || 0, icon: <Pill size={20} />, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Trait Associations', value: analysisResult?.traitAssociations || 0, icon: <Dna size={20} />, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Analysis Results</h1>

      <div className="card-win p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded flex items-center justify-center">
            <Dna className="text-primary-600" size={20} />
          </div>
          <div>
            <div className="font-medium text-gray-800 dark:text-white">{genomeData?.filename}</div>
            <div className="text-sm text-gray-500">{genomeData?.variantCount?.toLocaleString()} variants analyzed</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="card-win p-4">
            <div className={`w-10 h-10 ${stat.color} rounded flex items-center justify-center mb-3`}>{stat.icon}</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value.toLocaleString()}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-6">
        <Link to="/reports" className="btn-win btn-win-accent">Generate Detailed Reports</Link>
        <Link to="/upload" className="btn-win">Upload Different File</Link>
      </div>

      <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
        <p className="text-sm text-amber-800 dark:text-amber-400">
          <strong>Disclaimer:</strong> This analysis is for informational purposes only and should not be used for medical diagnosis or treatment decisions.
        </p>
      </div>
    </div>
  );
}
