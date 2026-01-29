import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Heart,
  Pill,
  Users,
  Palette,
  Upload,
  Download,
  Trash2,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { save } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '@/store/app';

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface GeneratedReport {
  id: string;
  type: string;
  title: string;
  generatedAt: string;
}

const reportTypes: ReportType[] = [
  {
    id: 'summary',
    name: 'Summary Report',
    description: 'Overview of all genetic findings',
    icon: <FileText size={24} />,
    color: 'bg-blue-500',
  },
  {
    id: 'health',
    name: 'Health Risks',
    description: 'Detailed health risk assessment',
    icon: <Heart size={24} />,
    color: 'bg-red-500',
  },
  {
    id: 'pharma',
    name: 'Drug Response',
    description: 'Pharmacogenomic insights',
    icon: <Pill size={24} />,
    color: 'bg-purple-500',
  },
  {
    id: 'carrier',
    name: 'Carrier Status',
    description: 'Inherited condition carrier screening',
    icon: <Users size={24} />,
    color: 'bg-green-500',
  },
  {
    id: 'traits',
    name: 'Traits',
    description: 'Genetic trait associations',
    icon: <Palette size={24} />,
    color: 'bg-pink-500',
  },
];

export default function ReportsPage() {
  const { hasGenomeData, analysisResult } = useAppStore();
  const [generating, setGenerating] = useState<string | null>(null);
  const [reports, setReports] = useState<GeneratedReport[]>([]);

  const handleGenerate = async (reportType: ReportType) => {
    setGenerating(reportType.id);

    try {
      // Simulate report generation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newReport: GeneratedReport = {
        id: `report_${Date.now()}`,
        type: reportType.id,
        title: reportType.name,
        generatedAt: new Date().toISOString(),
      };

      setReports((prev) => [newReport, ...prev]);
    } finally {
      setGenerating(null);
    }
  };

  const handleExport = async (report: GeneratedReport) => {
    try {
      const filePath = await save({
        defaultPath: `${report.title.replace(/\s+/g, '_')}.pdf`,
        filters: [
          { name: 'PDF', extensions: ['pdf'] },
          { name: 'HTML', extensions: ['html'] },
        ],
      });

      if (filePath) {
        await invoke('export_report', {
          reportId: report.id,
          outputPath: filePath,
          options: {
            format: filePath.endsWith('.pdf') ? 'pdf' : 'html',
            include_raw_data: false,
            encrypt: false,
          },
        });
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleDelete = (reportId: string) => {
    setReports((prev) => prev.filter((r) => r.id !== reportId));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getReportIcon = (type: string) => {
    return reportTypes.find((t) => t.id === type)?.icon || <FileText size={20} />;
  };

  const getReportColor = (type: string) => {
    return reportTypes.find((t) => t.id === type)?.color || 'bg-gray-500';
  };

  if (!hasGenomeData) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <FileText className="text-gray-400" size={40} />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            No Data Available
          </h2>
          <p className="text-gray-500 mb-4">Upload your genetic data to generate reports</p>
          <Link to="/upload" className="btn-mac btn-mac-primary inline-flex items-center gap-2">
            <Upload size={16} />
            Upload DNA Data
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Reports</h1>

      {/* Generate New Report */}
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        Generate Report
      </h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {reportTypes.map((reportType) => (
          <button
            key={reportType.id}
            className={`card-mac p-4 text-left transition-all ${
              generating === null ? 'hover:shadow-md hover:scale-[1.01]' : ''
            } ${!analysisResult ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => handleGenerate(reportType)}
            disabled={generating !== null || !analysisResult}
          >
            {generating === reportType.id ? (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="text-primary-600 animate-spin" size={24} />
                <span className="ml-2 text-primary-600">Generating...</span>
              </div>
            ) : (
              <>
                <div
                  className={`w-12 h-12 ${reportType.color} bg-opacity-20 rounded-xl flex items-center justify-center mb-3`}
                >
                  <span
                    className={reportType.color
                      .replace('bg-', 'text-')
                      .replace('-500', '-600')}
                  >
                    {reportType.icon}
                  </span>
                </div>
                <h3 className="font-medium text-gray-800 dark:text-white mb-1">
                  {reportType.name}
                </h3>
                <p className="text-sm text-gray-500">{reportType.description}</p>
              </>
            )}
          </button>
        ))}
      </div>

      {/* Saved Reports */}
      {reports.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Saved Reports
            </h2>
            <span className="text-sm text-gray-500">{reports.length} report(s)</span>
          </div>
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="card-mac p-4 flex items-center gap-3">
                <div
                  className={`w-10 h-10 ${getReportColor(report.type)} bg-opacity-20 rounded-lg flex items-center justify-center`}
                >
                  <span
                    className={getReportColor(report.type)
                      .replace('bg-', 'text-')
                      .replace('-500', '-600')}
                  >
                    {getReportIcon(report.type)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800 dark:text-white">
                    {report.title}
                  </div>
                  <div className="text-sm text-gray-500">
                    Generated {formatDate(report.generatedAt)}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="View Report"
                  >
                    <Eye className="text-gray-500" size={18} />
                  </button>
                  <button
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Export Report"
                    onClick={() => handleExport(report)}
                  >
                    <Download className="text-gray-500" size={18} />
                  </button>
                  <button
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete Report"
                    onClick={() => handleDelete(report.id)}
                  >
                    <Trash2 className="text-red-500" size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* No Reports Yet */}
      {reports.length === 0 && (
        <div className="card-mac p-6 text-center">
          <FileText className="text-gray-300 mx-auto mb-3" size={32} />
          <p className="text-gray-500">
            No reports generated yet. Select a report type above to get started.
          </p>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="mt-6 bg-green-50 dark:bg-green-900/20 rounded-xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg
            className="w-5 h-5 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <div>
          <h4 className="font-medium text-green-800 dark:text-green-400 mb-1">
            Private Reports
          </h4>
          <p className="text-sm text-green-700 dark:text-green-500">
            All reports are generated and stored locally on your Mac. They are never uploaded
            to external servers.
          </p>
        </div>
      </div>
    </div>
  );
}
