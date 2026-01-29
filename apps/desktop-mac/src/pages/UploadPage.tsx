import { useState } from 'react';
import { Upload, FileText, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '@/store/app';

interface ParseResult {
  success: boolean;
  variant_count: number;
  file_type: string;
  error: string | null;
}

type ProcessingStage = 'idle' | 'parsing' | 'analyzing' | 'complete' | 'error';

interface FileFormat {
  id: string;
  name: string;
  extensions: string[];
  description: string;
}

const supportedFormats: FileFormat[] = [
  {
    id: '23andme',
    name: '23andMe',
    extensions: ['.txt', '.txt.gz'],
    description: 'Raw data export from 23andMe',
  },
  {
    id: 'ancestry',
    name: 'AncestryDNA',
    extensions: ['.txt', '.txt.gz'],
    description: 'Raw data export from AncestryDNA',
  },
  {
    id: 'vcf',
    name: 'VCF Format',
    extensions: ['.vcf', '.vcf.gz'],
    description: 'Variant Call Format files',
  },
];

export default function UploadPage() {
  const { hasGenomeData, genomeData, setGenomeData, setAnalysisResult } = useAppStore();
  const [stage, setStage] = useState<ProcessingStage>('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSelectFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: 'Genetic Data',
            extensions: ['txt', 'vcf', 'gz'],
          },
        ],
      });

      if (selected) {
        await processFile(selected as string);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select file');
      setStage('error');
    }
  };

  const processFile = async (filePath: string) => {
    setStage('parsing');
    setProgress(10);
    setMessage('Reading file...');
    setError(null);

    try {
      // Parse the file
      setProgress(30);
      setMessage('Parsing genetic data...');

      const parseResult = await invoke<ParseResult>('parse_genome_file', {
        filePath,
      });

      if (!parseResult.success) {
        throw new Error(parseResult.error || 'Failed to parse file');
      }

      setProgress(50);
      setMessage('Analyzing variants...');
      setStage('analyzing');

      // Analyze variants
      const analysisResult = await invoke<{
        summary: {
          total_variants: number;
          clinical_count: number;
          drug_count: number;
          trait_count: number;
          actionable_findings: number;
        };
      }>('analyze_variants', {
        variantCount: parseResult.variant_count,
      });

      setProgress(100);
      setMessage('Complete!');
      setStage('complete');

      // Update store
      const filename = filePath.split('/').pop() || 'Unknown file';
      setGenomeData({
        source: parseResult.file_type,
        filename,
        variantCount: parseResult.variant_count,
        uploadedAt: new Date().toISOString(),
      });

      setAnalysisResult({
        id: `analysis_${Date.now()}`,
        timestamp: new Date().toISOString(),
        clinicalVariants: analysisResult.summary.clinical_count,
        pharmacogenomicVariants: analysisResult.summary.drug_count,
        traitAssociations: analysisResult.summary.trait_count,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
      setStage('error');
    }
  };

  const handleReset = () => {
    setStage('idle');
    setProgress(0);
    setMessage('');
    setError(null);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        Upload DNA Data
      </h1>

      {/* Current Status */}
      {hasGenomeData && stage === 'idle' && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mb-6 flex items-center gap-3">
          <Check className="text-green-600" size={24} />
          <div>
            <div className="font-medium text-green-800 dark:text-green-400">
              DNA Data Loaded
            </div>
            <div className="text-sm text-green-700 dark:text-green-500">
              {genomeData?.filename} ({genomeData?.variantCount?.toLocaleString()} variants)
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {stage === 'error' && error && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="text-red-600" size={24} />
          <div className="flex-1">
            <div className="font-medium text-red-800 dark:text-red-400">
              Processing Failed
            </div>
            <div className="text-sm text-red-700 dark:text-red-500">{error}</div>
          </div>
          <button
            onClick={handleReset}
            className="btn-mac flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`card-mac p-8 mb-6 text-center cursor-pointer transition-all ${
          stage === 'idle'
            ? 'hover:border-primary-500 hover:shadow-md'
            : 'pointer-events-none'
        } ${stage !== 'idle' && stage !== 'error' ? 'bg-primary-50 dark:bg-primary-900/10 border-primary-500' : ''}`}
        onClick={stage === 'idle' ? handleSelectFile : undefined}
      >
        {stage === 'idle' || stage === 'error' ? (
          <div>
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Upload className="text-primary-600" size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
              Upload Your DNA Data
            </h3>
            <p className="text-gray-500 mb-4">
              Click to select a file from your computer
            </p>
            <button className="btn-mac btn-mac-primary">Select File</button>
          </div>
        ) : (
          <div>
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              {stage === 'complete' ? (
                <Check className="text-green-600" size={32} />
              ) : (
                <RefreshCw className="text-primary-600 animate-spin" size={32} />
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
              {stage === 'parsing'
                ? 'Parsing Genome'
                : stage === 'analyzing'
                ? 'Analyzing Variants'
                : 'Complete!'}
            </h3>
            <p className="text-primary-600 mb-4">{message}</p>

            {/* Progress Bar */}
            <div className="w-full max-w-xs mx-auto">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-sm text-gray-500 mt-2">{progress}%</div>
            </div>
          </div>
        )}
      </div>

      {/* Supported Formats */}
      {(stage === 'idle' || stage === 'error') && (
        <>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Supported Formats
          </h2>
          <div className="space-y-3 mb-6">
            {supportedFormats.map((format) => (
              <div
                key={format.id}
                className="card-mac p-4 flex items-start gap-3"
              >
                <FileText className="text-primary-600 mt-0.5" size={20} />
                <div>
                  <div className="font-medium text-gray-800 dark:text-white">
                    {format.name}
                  </div>
                  <div className="text-sm text-gray-500">{format.description}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {format.extensions.join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Privacy Notice */}
      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 flex items-start gap-3">
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
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <div>
          <h4 className="font-medium text-green-800 dark:text-green-400 mb-1">
            Your Privacy is Protected
          </h4>
          <p className="text-sm text-green-700 dark:text-green-500">
            Your genetic data is processed entirely on your Mac. Nothing is uploaded to
            external servers.
          </p>
        </div>
      </div>
    </div>
  );
}
