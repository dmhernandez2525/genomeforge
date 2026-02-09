/**
 * Demo Mode Banner Component
 *
 * Displays a banner at the top of the page when demo mode is active,
 * showing the current demo user and providing an option to exit demo mode.
 */

import { useNavigate } from 'react-router-dom';
import { useDemoContext } from '../contexts/DemoContext';

export default function DemoModeBanner() {
  const { isDemoActive, currentDemoUser, deactivateDemo } = useDemoContext();
  const navigate = useNavigate();

  if (!isDemoActive || !currentDemoUser) {
    return null;
  }

  const handleExitDemo = () => {
    deactivateDemo();
    navigate('/');
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              DEMO
            </span>
            <div className="flex items-center gap-2">
              <img
                src={currentDemoUser.avatar}
                alt={currentDemoUser.name}
                className="h-6 w-6 rounded-full ring-2 ring-white/30"
              />
              <span className="text-sm font-medium">
                Viewing as <strong>{currentDemoUser.name}</strong>
              </span>
              <span className="hidden sm:inline text-xs text-white/70">
                ({currentDemoUser.role} view)
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleExitDemo}
            className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1 text-sm font-medium hover:bg-white/20 transition-colors"
          >
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
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Exit Demo
          </button>
        </div>
      </div>
    </div>
  );
}
