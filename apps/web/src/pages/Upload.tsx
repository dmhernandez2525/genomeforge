import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGenomeStore } from '../store/genome';

export default function UploadPage() {
  const navigate = useNavigate();
  const setGenome = useGenomeStore((state) => state.setGenome);
  const setLoading = useGenomeStore((state) => state.setLoading);

  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ stage: string; percent: number } | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setLoading(true);
      setProgress({ stage: 'Reading file...', percent: 0 });

      try {
        // Import parser dynamically to enable code splitting
        const { parseGenomeFile } = await import('@genomeforge/core');

        setProgress({ stage: 'Detecting format...', percent: 10 });

        const result = await parseGenomeFile(file, {
          onProgress: (stage, percent) => {
            setProgress({ stage, percent: 10 + percent * 0.8 });
          }
        });

        setProgress({ stage: 'Validating...', percent: 95 });

        if (!result.validation.valid) {
          throw new Error(result.validation.errors.join(', '));
        }

        setProgress({ stage: 'Complete!', percent: 100 });
        setGenome(result);

        // Navigate to analysis after short delay
        setTimeout(() => {
          navigate('/analysis');
        }, 500);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse genome file');
      } finally {
        setLoading(false);
      }
    },
    [setGenome, setLoading, navigate]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900">Upload Your Genome</h1>
      <p className="mt-2 text-gray-600">
        Your file is processed 100% locally in your browser. Nothing is uploaded to any server.
      </p>

      {/* Drop Zone */}
      <div
        className={`mt-8 border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {progress ? (
          <div>
            <div className="text-lg font-medium text-gray-900">{progress.stage}</div>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <div className="mt-2 text-sm text-gray-500">{progress.percent}%</div>
          </div>
        ) : (
          <>
            <div className="text-4xl mb-4">🧬</div>
            <p className="text-lg text-gray-600">Drag and drop your genome file here</p>
            <p className="mt-2 text-sm text-gray-500">or</p>
            <label className="mt-4 inline-block cursor-pointer">
              <span className="rounded-lg bg-primary-600 px-4 py-2 text-white font-medium hover:bg-primary-700">
                Browse Files
              </span>
              <input
                type="file"
                className="hidden"
                accept=".txt,.csv,.vcf,.gz"
                onChange={handleFileSelect}
              />
            </label>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Supported Formats */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Supported Formats</h2>
        <div className="mt-4 grid gap-2 text-sm text-gray-600">
          <div className="flex justify-between py-2 border-b">
            <span>23andMe</span>
            <span className="text-gray-400">.txt (TSV)</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span>AncestryDNA</span>
            <span className="text-gray-400">.txt (CSV)</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span>MyHeritage</span>
            <span className="text-gray-400">.csv</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span>FamilyTreeDNA</span>
            <span className="text-gray-400">.csv</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span>LivingDNA</span>
            <span className="text-gray-400">.csv</span>
          </div>
          <div className="flex justify-between py-2">
            <span>VCF (WGS/WES)</span>
            <span className="text-gray-400">.vcf</span>
          </div>
        </div>
      </div>
    </div>
  );
}
