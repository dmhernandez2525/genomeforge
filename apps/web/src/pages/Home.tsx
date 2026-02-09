/**
 * Home Page - Landing page for GenomeForge
 *
 * Shows marketing content with Sign In / Get Started buttons.
 * In demo mode, these buttons lead to the demo role selector.
 */

import { Link, Navigate } from 'react-router-dom';
import { useDemoContext } from '../contexts/DemoContext';
import { useGenomeStore } from '../store/genome';

export default function HomePage() {
  const genome = useGenomeStore((state) => state.genome);
  const { isDemoMode, isDemoActive } = useDemoContext();

  // If demo is active, redirect to analysis (user already logged in)
  if (isDemoActive && genome) {
    return <Navigate to="/analysis" replace />;
  }

  return (
    <div className="text-center">
      {/* Hero Section */}
      <div className="mb-6 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm text-blue-700">
        <span className="mr-2">
          <svg
            className="inline h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </span>
        Your DNA never leaves your device
      </div>

      <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl md:text-5xl">
        Your genes, your keys, your insights.
      </h1>
      <p className="mt-3 text-base text-gray-600 max-w-2xl mx-auto sm:mt-4 sm:text-lg">
        GenomeForge analyzes your DNA data 100% locally. Your genetic information never leaves your
        device. Get clinical-grade insights with complete privacy.
      </p>

      {/* CTA Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
        {isDemoMode ? (
          <>
            <Link
              to="/sign-in"
              className="rounded-lg bg-primary-600 px-8 py-3 text-white font-medium hover:bg-primary-700"
            >
              Get Started
            </Link>
            <Link
              to="/sign-in"
              className="rounded-lg border border-gray-300 px-8 py-3 text-gray-700 font-medium hover:bg-gray-50"
            >
              Sign In
            </Link>
          </>
        ) : (
          <>
            <Link
              to="/upload"
              className="rounded-lg bg-primary-600 px-8 py-3 text-white font-medium hover:bg-primary-700"
            >
              Upload Your Genome
            </Link>
            <Link
              to="/settings"
              className="rounded-lg border border-gray-300 px-8 py-3 text-gray-700 font-medium hover:bg-gray-50"
            >
              Configure AI
            </Link>
          </>
        )}
      </div>

      <p className="mt-4 text-sm text-gray-500">
        {isDemoMode
          ? 'Try the demo with pre-loaded sample data'
          : 'No account required. No data uploaded. Works offline.'}
      </p>

      {/* Features */}
      <div className="mt-10 grid gap-4 sm:mt-16 sm:gap-8 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary-100 text-primary-600 mx-auto mb-4">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">100% Local Processing</h3>
          <p className="mt-2 text-sm text-gray-600">
            Your DNA data is processed entirely in your browser. Nothing is ever uploaded.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary-100 text-primary-600 mx-auto mb-4">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">BYOK AI</h3>
          <p className="mt-2 text-sm text-gray-600">
            Use your own API keys or run AI 100% offline with Ollama. You control your data.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary-100 text-primary-600 mx-auto mb-4">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Clinical Databases</h3>
          <p className="mt-2 text-sm text-gray-600">
            Match your variants against ClinVar (341K+) and PharmGKB drug interactions.
          </p>
        </div>
      </div>

      {/* What You Get Section */}
      <div className="mt-10 sm:mt-16">
        <h2 className="text-xl font-bold text-gray-900 mb-4 sm:text-2xl sm:mb-8">Comprehensive Analysis</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="text-2xl mb-2">
              <svg
                className="inline h-6 w-6 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Disease Risk</h3>
            <p className="text-xs text-gray-600 mt-1">ClinVar pathogenic variants</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="text-2xl mb-2">
              <svg
                className="inline h-6 w-6 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Pharmacogenomics</h3>
            <p className="text-xs text-gray-600 mt-1">Drug metabolism insights</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="text-2xl mb-2">
              <svg
                className="inline h-6 w-6 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Polygenic Scores</h3>
            <p className="text-xs text-gray-600 mt-1">Risk percentiles</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="text-2xl mb-2">
              <svg
                className="inline h-6 w-6 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">AI Chat</h3>
            <p className="text-xs text-gray-600 mt-1">Ask about your genome</p>
          </div>
        </div>
      </div>

      {/* Medical Disclaimer */}
      <div className="mt-10 sm:mt-16 rounded-lg border border-yellow-200 bg-yellow-50 p-4 sm:p-6 text-left">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="font-semibold text-yellow-800">Medical Disclaimer</h3>
            <p className="mt-2 text-sm text-yellow-700">
              GenomeForge is for informational and educational purposes only. It is not intended to
              diagnose, treat, cure, or prevent any disease. Always consult qualified healthcare
              professionals before making any medical decisions based on genetic information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
