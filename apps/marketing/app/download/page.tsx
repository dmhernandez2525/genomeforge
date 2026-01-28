import Link from 'next/link';

export const metadata = {
  title: 'Download - GenomeForge',
  description: 'Download GenomeForge for your platform.'
};

export default function Download() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="border-b border-gray-100">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold text-primary-600">
            GenomeForge
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <Link href="/features" className="text-gray-600 hover:text-gray-900">
              Features
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
              Pricing
            </Link>
            <Link href="/docs" className="text-gray-600 hover:text-gray-900">
              Docs
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-gray-900">
              About
            </Link>
          </div>
        </nav>
      </header>

      {/* Download Section */}
      <section className="section-padding">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 sm:text-5xl">Get GenomeForge</h1>
          <p className="mb-12 text-lg text-gray-600">
            Choose your platform. All versions include 100% local processing.
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Web App */}
            <div className="rounded-xl border-2 border-primary-600 p-6">
              <div className="mb-4 text-4xl">🌐</div>
              <h2 className="mb-2 text-xl font-semibold">Web App</h2>
              <p className="mb-4 text-sm text-gray-600">
                Works in any modern browser. No installation required.
              </p>
              <a
                href="#"
                className="block w-full rounded-lg bg-primary-600 py-3 font-medium text-white hover:bg-primary-700"
              >
                Launch Web App
              </a>
              <p className="mt-2 text-xs text-gray-500">Chrome, Firefox, Safari, Edge</p>
            </div>

            {/* macOS */}
            <div className="rounded-xl border border-gray-200 p-6">
              <div className="mb-4 text-4xl">🍎</div>
              <h2 className="mb-2 text-xl font-semibold">macOS</h2>
              <p className="mb-4 text-sm text-gray-600">
                Native app with menubar access and Ollama integration.
              </p>
              <button
                disabled
                className="block w-full cursor-not-allowed rounded-lg bg-gray-200 py-3 font-medium text-gray-500"
              >
                Coming Soon
              </button>
              <p className="mt-2 text-xs text-gray-500">Requires macOS 12+</p>
            </div>

            {/* Windows */}
            <div className="rounded-xl border border-gray-200 p-6">
              <div className="mb-4 text-4xl">🪟</div>
              <h2 className="mb-2 text-xl font-semibold">Windows</h2>
              <p className="mb-4 text-sm text-gray-600">Lightweight Tauri app with local AI.</p>
              <button
                disabled
                className="block w-full cursor-not-allowed rounded-lg bg-gray-200 py-3 font-medium text-gray-500"
              >
                Coming Soon
              </button>
              <p className="mt-2 text-xs text-gray-500">Requires Windows 10+</p>
            </div>

            {/* iOS */}
            <div className="rounded-xl border border-gray-200 p-6">
              <div className="mb-4 text-4xl">📱</div>
              <h2 className="mb-2 text-xl font-semibold">iOS</h2>
              <p className="mb-4 text-sm text-gray-600">Full analysis on your iPhone or iPad.</p>
              <button
                disabled
                className="block w-full cursor-not-allowed rounded-lg bg-gray-200 py-3 font-medium text-gray-500"
              >
                Coming Soon
              </button>
              <p className="mt-2 text-xs text-gray-500">Requires iOS 15+</p>
            </div>

            {/* Android */}
            <div className="rounded-xl border border-gray-200 p-6">
              <div className="mb-4 text-4xl">🤖</div>
              <h2 className="mb-2 text-xl font-semibold">Android</h2>
              <p className="mb-4 text-sm text-gray-600">Privacy-first analysis on Android.</p>
              <button
                disabled
                className="block w-full cursor-not-allowed rounded-lg bg-gray-200 py-3 font-medium text-gray-500"
              >
                Coming Soon
              </button>
              <p className="mt-2 text-xs text-gray-500">Requires Android 10+</p>
            </div>
          </div>
        </div>
      </section>

      {/* System Requirements */}
      <section className="section-padding bg-gray-50">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">System Requirements</h2>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="mb-4 font-semibold text-gray-900">Web App</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Modern browser (Chrome 90+, Firefox 90+, Safari 15+, Edge 90+)</li>
              <li>• 500MB available storage for database caching</li>
              <li>• 2GB RAM recommended for large genome files</li>
            </ul>
          </div>

          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="mb-4 font-semibold text-gray-900">For Ollama (Offline AI)</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 16GB RAM minimum (32GB recommended)</li>
              <li>• 10GB disk space for BioMistral-7B model</li>
              <li>
                • Apple Silicon Mac or NVIDIA GPU recommended for best performance
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} GenomeForge. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
