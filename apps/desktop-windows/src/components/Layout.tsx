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
      {/* Sidebar - Windows 11 Navigation Pane style */}
      <aside className="w-56 bg-gray-50 dark:bg-[#1f1f1f] border-r border-gray-200 dark:border-[#2b2b2b] flex flex-col">
        {/* Logo */}
        <div className="px-4 py-4 flex items-center gap-3 border-b border-gray-200 dark:border-[#2b2b2b]">
          <div className="w-8 h-8 bg-primary-600 rounded flex items-center justify-center">
            <Dna size={18} className="text-white" />
          </div>
          <span className="font-semibold text-gray-800 dark:text-white">GenomeForge</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                  >
                    {item.icon}
                    <span className="text-sm">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Privacy Badge */}
        <div className="px-3 py-2 mx-2 mb-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <Shield size={14} />
            <span className="text-xs font-medium">100% Local Processing</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 text-xs text-gray-500 dark:text-gray-500 border-t border-gray-200 dark:border-[#2b2b2b]">
          <div>GenomeForge v{appVersion || '0.1.0'}</div>
          {systemInfo && (
            <div className="truncate mt-0.5">
              {systemInfo.os_version || 'Windows'} ({systemInfo.arch})
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#1f1f1f]">
        {/* Page Content */}
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
