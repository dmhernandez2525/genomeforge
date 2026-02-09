import { useState, useCallback, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface NavTab {
  path: string;
  label: string;
  icon: (active: boolean) => JSX.Element;
}

const tabs: NavTab[] = [
  {
    path: '/',
    label: 'Home',
    icon: (active) => (
      <svg
        className={`h-6 w-6 ${active ? 'text-primary-600' : 'text-gray-400'}`}
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 0 : 1.5}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"
        />
      </svg>
    ),
  },
  {
    path: '/analysis',
    label: 'Analysis',
    icon: (active) => (
      <svg
        className={`h-6 w-6 ${active ? 'text-primary-600' : 'text-gray-400'}`}
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 0 : 1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
  {
    path: '/reports',
    label: 'Reports',
    icon: (active) => (
      <svg
        className={`h-6 w-6 ${active ? 'text-primary-600' : 'text-gray-400'}`}
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 0 : 1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    path: '/chat',
    label: 'Chat',
    icon: (active) => (
      <svg
        className={`h-6 w-6 ${active ? 'text-primary-600' : 'text-gray-400'}`}
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 0 : 1.5}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
  },
];

interface SheetItem {
  path: string;
  label: string;
  description: string;
  icon: JSX.Element;
}

const sheetItems: SheetItem[] = [
  {
    path: '/upload',
    label: 'Upload Genome',
    description: 'Import your DNA data file',
    icon: (
      <svg
        className="h-5 w-5 text-primary-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
        />
      </svg>
    ),
  },
  {
    path: '/databases',
    label: 'Databases',
    description: 'Manage reference databases',
    icon: (
      <svg
        className="h-5 w-5 text-primary-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
        />
      </svg>
    ),
  },
  {
    path: '/settings',
    label: 'Settings',
    description: 'AI provider and API keys',
    icon: (
      <svg
        className="h-5 w-5 text-primary-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const isActive = useCallback(
    (path: string) => {
      if (path === '/') return location.pathname === '/';
      return location.pathname.startsWith(path);
    },
    [location.pathname]
  );

  // Close sheet when route changes
  useEffect(() => {
    setSheetOpen(false);
  }, [location.pathname]);

  // Close sheet on outside click
  useEffect(() => {
    if (!sheetOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        setSheetOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [sheetOpen]);

  // Close sheet on Escape key
  useEffect(() => {
    if (!sheetOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSheetOpen(false);
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [sheetOpen]);

  const handleSheetNavigate = useCallback(
    (path: string) => {
      setSheetOpen(false);
      navigate(path);
    },
    [navigate]
  );

  // Split tabs into left pair and right pair for FAB placement
  const leftTabs = tabs.slice(0, 2);
  const rightTabs = tabs.slice(2, 4);

  return (
    <>
      {/* Backdrop overlay */}
      {sheetOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 animate-fade-in md:hidden" />
      )}

      {/* Bottom Sheet */}
      {sheetOpen && (
        <div
          ref={sheetRef}
          className="fixed bottom-16 left-0 right-0 z-50 mx-auto max-w-lg px-4 pb-2 md:hidden"
        >
          <div className="animate-slide-up rounded-2xl border border-gray-200 bg-white shadow-xl">
            {/* Sheet handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-8 rounded-full bg-gray-300" />
            </div>

            {/* Sheet items */}
            <nav className="px-2 pb-3">
              {sheetItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleSheetNavigate(item.path)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                  <svg
                    className="h-4 w-4 shrink-0 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-sm md:hidden">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
          {/* Left tabs */}
          {leftTabs.map((tab) => (
            <Link
              key={tab.path}
              to={tab.path}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1"
              aria-label={tab.label}
            >
              {tab.icon(isActive(tab.path))}
              <span
                className={`text-[10px] font-medium ${
                  isActive(tab.path) ? 'text-primary-600' : 'text-gray-400'
                }`}
              >
                {tab.label}
              </span>
            </Link>
          ))}

          {/* Center FAB */}
          <div className="relative flex flex-1 items-center justify-center">
            <button
              type="button"
              onClick={() => setSheetOpen((prev) => !prev)}
              className={`-mt-5 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all ${
                sheetOpen
                  ? 'bg-gray-600 rotate-45'
                  : 'bg-primary-600 hover:bg-primary-700'
              }`}
              aria-label={sheetOpen ? 'Close menu' : 'Open quick actions'}
            >
              <svg
                className="h-7 w-7 text-white transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>

          {/* Right tabs */}
          {rightTabs.map((tab) => (
            <Link
              key={tab.path}
              to={tab.path}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1"
              aria-label={tab.label}
            >
              {tab.icon(isActive(tab.path))}
              <span
                className={`text-[10px] font-medium ${
                  isActive(tab.path) ? 'text-primary-600' : 'text-gray-400'
                }`}
              >
                {tab.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Safe area inset for notched devices */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </>
  );
}
