import { Link } from 'react-router-dom';
import { useGenomeStore } from '../store/genome';

export default function HomePage() {
  const genome = useGenomeStore((state) => state.genome);

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
        Your genes, your keys, your insights.
      </h1>
      <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
        GenomeForge analyzes your DNA data 100% locally. Your genetic information never leaves your
        device.
      </p>

      <div className="mt-8 flex justify-center gap-4">
        {genome ? (
          <Link
            to="/analysis"
            className="rounded-lg bg-primary-600 px-6 py-3 text-white font-medium hover:bg-primary-700"
          >
            View Analysis
          </Link>
        ) : (
          <Link
            to="/upload"
            className="rounded-lg bg-primary-600 px-6 py-3 text-white font-medium hover:bg-primary-700"
          >
            Upload Your Genome
          </Link>
        )}
        <Link
          to="/settings"
          className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 font-medium hover:bg-gray-50"
        >
          Configure AI
        </Link>
      </div>

      {/* Features */}
      <div className="mt-16 grid gap-8 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 p-6">
          <div className="text-3xl mb-4">🔒</div>
          <h3 className="text-lg font-semibold text-gray-900">100% Local Processing</h3>
          <p className="mt-2 text-sm text-gray-600">
            Your DNA data is processed entirely in your browser. Nothing is ever uploaded.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-6">
          <div className="text-3xl mb-4">🤖</div>
          <h3 className="text-lg font-semibold text-gray-900">BYOK AI</h3>
          <p className="mt-2 text-sm text-gray-600">
            Use your own API keys or run AI 100% offline with Ollama. You control your data.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-6">
          <div className="text-3xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900">Clinical Databases</h3>
          <p className="mt-2 text-sm text-gray-600">
            Match your variants against ClinVar (341K+) and PharmGKB drug interactions.
          </p>
        </div>
      </div>

      {/* Medical Disclaimer */}
      <div className="mt-16 rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-left">
        <h3 className="font-semibold text-yellow-800">Medical Disclaimer</h3>
        <p className="mt-2 text-sm text-yellow-700">
          GenomeForge is for informational and educational purposes only. It is not intended to
          diagnose, treat, cure, or prevent any disease. Always consult qualified healthcare
          professionals before making any medical decisions based on genetic information.
        </p>
      </div>
    </div>
  );
}
