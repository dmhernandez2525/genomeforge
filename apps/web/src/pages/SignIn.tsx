/**
 * Sign In Page
 *
 * In demo mode, shows the demo role selector.
 * In production, would show actual authentication options.
 */

import { Link, Navigate } from 'react-router-dom';
import DemoRoleSelector from '../components/DemoRoleSelector';
import { useDemoContext } from '../contexts/DemoContext';

export default function SignInPage() {
  const { isDemoMode, isDemoActive } = useDemoContext();

  // If already logged in (demo active), redirect to analysis
  if (isDemoActive) {
    return <Navigate to="/analysis" replace />;
  }

  // In demo mode, show the demo role selector
  if (isDemoMode) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-12">
        <DemoRoleSelector />
        <div className="mt-8">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  // Production mode: show sign in options (placeholder)
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Sign In to GenomeForge
        </h1>
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <p className="text-center text-gray-600 mb-6">
            Sign in to access your genetic analysis results.
          </p>
          {/* Placeholder for actual auth - would use Clerk, Auth0, etc. */}
          <button
            type="button"
            className="w-full rounded-lg bg-primary-600 px-4 py-3 text-white font-medium hover:bg-primary-700 mb-4"
            disabled
          >
            Continue with Google
          </button>
          <button
            type="button"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-700 font-medium hover:bg-gray-50"
            disabled
          >
            Continue with Email
          </button>
          <p className="mt-6 text-center text-xs text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
