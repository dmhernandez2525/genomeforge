/**
 * Demo Role Selector Component
 *
 * Allows users to select a demo role when demo mode is enabled.
 * Displays available demo users with their descriptions.
 */

import { useDemoContext } from '../contexts/DemoContext';
import type { DemoRole } from '../lib/demo-data';

export default function DemoRoleSelector() {
  const { demoUsers, activateDemo } = useDemoContext();

  const handleSelectRole = (role: DemoRole) => {
    activateDemo(role);
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 mb-4">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Demo Mode
        </div>
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Experience GenomeForge</h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Select a demo profile to explore the platform with pre-loaded genetic data. No account or
          personal data required.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-3xl w-full">
        {demoUsers.map((user) => (
          <button
            type="button"
            key={user.id}
            onClick={() => handleSelectRole(user.role)}
            className="group relative rounded-xl border-2 border-gray-200 bg-white p-6 text-left transition-all hover:border-primary-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <div className="flex items-start gap-4">
              <img
                src={user.avatar}
                alt={user.name}
                className="h-16 w-16 rounded-full bg-gray-100"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600">
                  {user.name}
                </h3>
                <p className="text-sm font-medium text-primary-600 capitalize">{user.role} View</p>
                <p className="mt-2 text-sm text-gray-600">{user.description}</p>
              </div>
            </div>

            {/* Role-specific features */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Features
              </p>
              <div className="flex flex-wrap gap-2">
                {user.role === 'researcher' && (
                  <>
                    <FeatureBadge label="Full Analysis" />
                    <FeatureBadge label="Raw Data Export" />
                    <FeatureBadge label="Research Tools" />
                  </>
                )}
                {user.role === 'patient' && (
                  <>
                    <FeatureBadge label="Health Insights" />
                    <FeatureBadge label="Drug Interactions" />
                    <FeatureBadge label="Risk Reports" />
                  </>
                )}
              </div>
            </div>

            {/* Hover indicator */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg
                className="h-5 w-5 text-primary-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {/* Additional info */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Demo data is entirely fictional and for demonstration purposes only.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          In production, your genetic data is processed 100% locally and never leaves your device.
        </p>
      </div>
    </div>
  );
}

function FeatureBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
      {label}
    </span>
  );
}
