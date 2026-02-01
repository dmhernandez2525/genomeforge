import { Link, Outlet, useLocation } from 'react-router-dom';
import { useDemoContext } from '../contexts/DemoContext';
import DemoModeBanner from './DemoModeBanner';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Upload', href: '/upload' },
  { name: 'Analysis', href: '/analysis' },
  { name: 'Reports', href: '/reports' },
  { name: 'Chat', href: '/chat' },
  { name: 'Databases', href: '/databases' },
  { name: 'Settings', href: '/settings' }
];

export default function Layout() {
  const location = useLocation();
  const { isDemoMode, isDemoActive } = useDemoContext();

  // Only show full navigation when user is "logged in" (demo active or production mode)
  const showFullNav = !isDemoMode || isDemoActive;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Mode Banner */}
      <DemoModeBanner />

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="text-xl font-bold text-primary-600">
              GenomeForge
            </Link>

            {showFullNav ? (
              <nav className="hidden md:flex items-center gap-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`text-sm font-medium ${
                      location.pathname === item.href
                        ? 'text-primary-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            ) : (
              /* Limited navigation for non-logged-in users */
              <nav className="hidden md:flex items-center gap-6">
                <Link
                  to="/"
                  className={`text-sm font-medium ${
                    location.pathname === '/'
                      ? 'text-primary-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Home
                </Link>
              </nav>
            )}

            {/* Auth Buttons */}
            <div className="flex items-center gap-4">
              {isDemoMode && !isDemoActive && (
                <>
                  <Link
                    to="/sign-in"
                    className="text-sm font-medium text-gray-600 hover:text-gray-900"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/sign-in"
                    className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500">
          <p>Your DNA data never leaves your device.</p>
          <p className="mt-2">GenomeForge - Privacy-first genetic analysis</p>
        </div>
      </footer>
    </div>
  );
}
