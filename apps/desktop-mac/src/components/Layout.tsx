import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Upload,
  Activity,
  FileText,
  Settings,
  Dna,
  Shield,
} from 'lucide-react';

interface SystemInfo {
  os: string;
  os_version: string;
  arch: string;
  memory_total: number;
  cpu_cores: number;
}

interface LayoutProps {
  children: ReactNode;
  appVersion: string;
  systemInfo: SystemInfo | null;
}

interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Home', icon: <Home size={18} /> },
  { path: '/upload', label: 'Upload', icon: <Upload size={18} /> },
  { path: '/analysis', label: 'Analysis', icon: <Activity size={18} /> },
  { path: '/reports', label: 'Reports', icon: <FileText size={18} /> },
  { path: '/settings', label: 'Settings', icon: <Settings size={18} /> },
];

export default function Layout({ children, appVersion, systemInfo }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        {/* macOS Titlebar space */}
        <div
          data-tauri-drag-region
          className="h-7 flex items-center justify-center border-b border-gray-200 dark:border-gray-800"
        >
          {/* Traffic lights space on macOS */}
        </div>

        {/* Logo */}
        <div className="px-4 py-3 flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <Dna size={20} className="text-white" />
          </div>
          <span className="font-semibold text-gray-800 dark:text-white">GenomeForge</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-2">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Privacy Badge */}
        <div className="px-3 py-2 mx-2 mb-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <Shield size={14} />
            <span className="text-xs font-medium">100% Local Processing</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-500 border-t border-gray-200 dark:border-gray-800">
          <div>v{appVersion || '0.1.0'}</div>
          {systemInfo && (
            <div className="truncate">
              macOS {systemInfo.os_version} ({systemInfo.arch})
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-950">
        {/* Titlebar for dragging */}
        <div
          data-tauri-drag-region
          className="h-7 flex-shrink-0 border-b border-gray-100 dark:border-gray-900"
        />

        {/* Page Content */}
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
