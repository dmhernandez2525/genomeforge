import { Link } from 'react-router-dom';
import { Activity, AlertCircle, Pill, Dna, Upload } from 'lucide-react';
import { useAppStore } from '@/store/app';

export default function AnalysisPage() {
  const { hasGenomeData, analysisResult, genomeData } = useAppStore();

  if (!hasGenomeData) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Activity className="text-gray-400" size={40} />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            No Analysis Data
          </h2>
          <p className="text-gray-500 mb-4">
            Upload your genetic data to see analysis results
          </p>
          <Link to="/upload" className="btn-mac btn-mac-primary inline-flex items-center gap-2">
            <Upload size={16} />
            Upload DNA Data
          </Link>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Clinical Findings',
      value: analysisResult?.clinicalVariants || 0,
      icon: <AlertCircle size={20} />,
      color: 'text-red-600 bg-red-50 dark:bg-red-900/20',
    },
    {
      label: 'Drug Responses',
      value: analysisResult?.pharmacogenomicVariants || 0,
      icon: <Pill size={20} />,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
    },
    {
      label: 'Trait Associations',
      value: analysisResult?.traitAssociations || 0,
      icon: <Dna size={20} />,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        Analysis Results
      </h1>

      {/* File Info */}
      <div className="card-mac p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
            <Dna className="text-primary-600" size={20} />
          </div>
          <div>
            <div className="font-medium text-gray-800 dark:text-white">
              {genomeData?.filename}
            </div>
            <div className="text-sm text-gray-500">
              {genomeData?.variantCount?.toLocaleString()} variants analyzed
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="card-mac p-4">
            <div
              className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-3`}
            >
              {stat.icon}
            </div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">
              {stat.value.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Findings Sections */}
      <div className="space-y-6">
        {/* Clinical Findings */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
            <AlertCircle className="text-red-600" size={20} />
            Clinical Findings
          </h2>
          <div className="card-mac p-4">
            {analysisResult?.clinicalVariants && analysisResult.clinicalVariants > 0 ? (
              <p className="text-gray-600 dark:text-gray-400">
                Found {analysisResult.clinicalVariants} variants with clinical significance.
                Review your detailed reports for more information.
              </p>
            ) : (
              <p className="text-gray-500">
                No clinically significant variants found. This is generally good news, but
                does not guarantee absence of health risks.
              </p>
            )}
          </div>
        </section>

        {/* Drug Responses */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
            <Pill className="text-purple-600" size={20} />
            Drug Response Insights
          </h2>
          <div className="card-mac p-4">
            {analysisResult?.pharmacogenomicVariants &&
            analysisResult.pharmacogenomicVariants > 0 ? (
              <p className="text-gray-600 dark:text-gray-400">
                Found {analysisResult.pharmacogenomicVariants} pharmacogenomic variants that
                may affect your response to medications.
              </p>
            ) : (
              <p className="text-gray-500">
                No significant pharmacogenomic variants detected in the analyzed data.
              </p>
            )}
          </div>
        </section>

        {/* Traits */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
            <Dna className="text-blue-600" size={20} />
            Trait Associations
          </h2>
          <div className="card-mac p-4">
            {analysisResult?.traitAssociations && analysisResult.traitAssociations > 0 ? (
              <p className="text-gray-600 dark:text-gray-400">
                Found {analysisResult.traitAssociations} genetic variants associated with
                various traits and characteristics.
              </p>
            ) : (
              <p className="text-gray-500">
                No trait associations found in the analyzed data.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <Link to="/reports" className="btn-mac btn-mac-primary">
          Generate Detailed Reports
        </Link>
        <Link to="/upload" className="btn-mac">
          Upload Different File
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
        <p className="text-sm text-amber-800 dark:text-amber-400">
          <strong>Disclaimer:</strong> This analysis is for informational purposes only and
          should not be used for medical diagnosis or treatment decisions. Always consult
          with a qualified healthcare professional for interpretation of genetic data.
        </p>
      </div>
    </div>
  );
}
