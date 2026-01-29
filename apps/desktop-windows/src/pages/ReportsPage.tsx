import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Heart, Pill, Users, Palette, Upload, Download, Trash2, Eye, RefreshCw } from 'lucide-react';
import { save } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '@/store/app';

interface GeneratedReport {
  id: string;
  type: string;
  title: string;
  generatedAt: string;
}

const reportTypes = [
  { id: 'summary', name: 'Summary Report', description: 'Overview of all genetic findings', icon: <FileText size={24} />, color: 'bg-blue-500' },
  { id: 'health', name: 'Health Risks', description: 'Detailed health risk assessment', icon: <Heart size={24} />, color: 'bg-red-500' },
  { id: 'pharma', name: 'Drug Response', description: 'Pharmacogenomic insights', icon: <Pill size={24} />, color: 'bg-purple-500' },
  { id: 'carrier', name: 'Carrier Status', description: 'Inherited condition screening', icon: <Users size={24} />, color: 'bg-green-500' },
  { id: 'traits', name: 'Traits', description: 'Genetic trait associations', icon: <Palette size={24} />, color: 'bg-pink-500' },
];

export default function ReportsPage() {
  const { hasGenomeData, analysisResult } = useAppStore();
  const [generating, setGenerating] = useState<string | null>(null);
  const [reports, setReports] = useState<GeneratedReport[]>([]);

  const handleGenerate = async (reportType: (typeof reportTypes)[0]) => {
    setGenerating(reportType.id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setReports((prev) => [
        { id: `report_${Date.now()}`, type: reportType.id, title: reportType.name, generatedAt: new Date().toISOString() },
        ...prev,
      ]);
    } finally {
      setGenerating(null);
    }
  };

  const handleExport = async (report: GeneratedReport) => {
    const filePath = await save({
      defaultPath: `${report.title.replace(/\s+/g, '_')}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (filePath) {
      await invoke('export_report', { reportId: report.id, outputPath: filePath, options: { format: 'pdf', include_raw_data: false, encrypt: false } });
    }
  };

  if (!hasGenomeData) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <FileText className="text-gray-400" size={40} />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No Data Available</h2>
          <p className="text-gray-500 mb-4">Upload your genetic data to generate reports</p>
          <Link to="/upload" className="btn-win btn-win-accent inline-flex items-center gap-2">
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

      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Generate Report</h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {reportTypes.map((rt) => (
          <button
            key={rt.id}
            className={`card-win p-4 text-left transition-all ${generating === null ? 'hover:border-primary-500' : ''} ${!analysisResult ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => handleGenerate(rt)}
            disabled={generating !== null || !analysisResult}
          >
            {generating === rt.id ? (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="text-primary-600 animate-spin" size={24} />
                <span className="ml-2 text-primary-600">Generating...</span>
              </div>
            ) : (
              <>
                <div className={`w-12 h-12 ${rt.color} bg-opacity-20 rounded flex items-center justify-center mb-3`}>
                  <span className={rt.color.replace('bg-', 'text-').replace('-500', '-600')}>{rt.icon}</span>
                </div>
                <h3 className="font-medium text-gray-800 dark:text-white mb-1">{rt.name}</h3>
                <p className="text-sm text-gray-500">{rt.description}</p>
              </>
            )}
          </button>
        ))}
      </div>

      {reports.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Saved Reports</h2>
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="card-win p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded flex items-center justify-center">
                  <FileText className="text-primary-600" size={20} />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800 dark:text-white">{r.title}</div>
                  <div className="text-sm text-gray-500">Generated {new Date(r.generatedAt).toLocaleDateString()}</div>
                </div>
                <div className="flex gap-1">
                  <button className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"><Eye className="text-gray-500" size={18} /></button>
                  <button className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => handleExport(r)}><Download className="text-gray-500" size={18} /></button>
                  <button className="p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => setReports((p) => p.filter((x) => x.id !== r.id))}><Trash2 className="text-red-500" size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {reports.length === 0 && (
        <div className="card-win p-6 text-center">
          <FileText className="text-gray-300 mx-auto mb-3" size={32} />
          <p className="text-gray-500">No reports generated yet. Select a report type above to get started.</p>
        </div>
      )}
    </div>
  );
}
