import { Link } from 'react-router-dom';
import { Upload, Activity, FileText, MessageSquare, Users, Search } from 'lucide-react';
import { useAppStore } from '@/store/app';
import { ReactNode } from 'react';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  path: string;
  color: string;
  disabled?: boolean;
}

export default function HomePage() {
  const { hasGenomeData, analysisResult, databaseStatus } = useAppStore();

  const features: Feature[] = [
    {
      id: 'upload',
      title: 'Upload DNA',
      description: 'Import your genetic data from 23andMe, AncestryDNA, or VCF files',
      icon: <Upload size={24} />,
      path: '/upload',
      color: 'bg-blue-500',
    },
    {
      id: 'analysis',
      title: 'View Analysis',
      description: 'Explore your genetic variants and health insights',
      icon: <Activity size={24} />,
      path: '/analysis',
      color: 'bg-purple-500',
      disabled: !hasGenomeData,
    },
    {
      id: 'reports',
      title: 'Reports',
      description: 'Generate detailed genetic health reports',
      icon: <FileText size={24} />,
      path: '/reports',
      color: 'bg-green-500',
      disabled: !analysisResult,
    },
    {
      id: 'chat',
      title: 'AI Assistant',
      description: 'Ask questions about your genetic data',
      icon: <MessageSquare size={24} />,
      path: '/chat',
      color: 'bg-red-500',
    },
    {
      id: 'family',
      title: 'Family',
      description: 'Compare variants with family members',
      icon: <Users size={24} />,
      path: '/family',
      color: 'bg-pink-500',
    },
    {
      id: 'search',
      title: 'Search',
      description: 'Find variants by gene, rsID, or condition',
      icon: <Search size={24} />,
      path: '/search',
      color: 'bg-gray-500',
      disabled: !hasGenomeData,
    },
  ];

  const loadedDatabases = Object.values(databaseStatus).filter((s) => s.loaded).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="bg-primary-600 rounded-lg p-6 mb-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome to GenomeForge</h1>
        <p className="text-primary-100">Your privacy-first genetic analysis companion</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card-win p-4 flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded flex items-center justify-center ${
              hasGenomeData ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full ${hasGenomeData ? 'bg-green-500' : 'bg-gray-400'}`}
            />
          </div>
          <div>
            <div className="font-medium text-gray-800 dark:text-white">
              {hasGenomeData ? 'DNA Loaded' : 'No DNA Data'}
            </div>
            <div className="text-xs text-gray-500">
              {hasGenomeData ? 'Ready for analysis' : 'Upload to get started'}
            </div>
          </div>
        </div>

        <div className="card-win p-4 flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded flex items-center justify-center ${
              loadedDatabases > 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full ${loadedDatabases > 0 ? 'bg-green-500' : 'bg-gray-400'}`}
            />
          </div>
          <div>
            <div className="font-medium text-gray-800 dark:text-white">
              {loadedDatabases}/3 Databases
            </div>
            <div className="text-xs text-gray-500">Reference databases loaded</div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Get Started</h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        {features.map((feature) => (
          <Link
            key={feature.id}
            to={feature.disabled ? '#' : feature.path}
            className={`card-win p-4 transition-all ${
              feature.disabled
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:border-primary-500 hover:shadow-sm'
            }`}
            onClick={(e) => feature.disabled && e.preventDefault()}
          >
            <div
              className={`w-12 h-12 ${feature.color} bg-opacity-20 rounded flex items-center justify-center mb-3`}
            >
              <span className={feature.color.replace('bg-', 'text-').replace('-500', '-600')}>
                {feature.icon}
              </span>
            </div>
            <h3 className="font-medium text-gray-800 dark:text-white mb-1">{feature.title}</h3>
            <p className="text-sm text-gray-500">{feature.description}</p>
          </Link>
        ))}
      </div>

      {/* Privacy Notice */}
      <div className="bg-green-50 dark:bg-green-900/20 rounded p-4 border border-green-200 dark:border-green-800 flex items-start gap-3">
        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded flex items-center justify-center flex-shrink-0">
          <svg
            className="w-5 h-5 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <div>
          <h4 className="font-medium text-green-800 dark:text-green-400 mb-1">100% Private</h4>
          <p className="text-sm text-green-700 dark:text-green-500">
            Your genetic data never leaves your computer. All processing happens locally on your PC.
          </p>
        </div>
      </div>
    </div>
  );
}
